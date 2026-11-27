import { compositeMembers, isCompositeType } from "../../token-model/composite.js";
import { pathKey } from "../../token-model/guards.js";
import { type Logger } from "../../logger.js";
import { type PluginContext, type PluginDiagnostic } from "../types.js";
import {
  type ThemeAxis,
  type ThemeOverride,
  type TokenEntry,
  type TokenRegistry,
} from "../../token-model/registry.js";
import { type TokenLayer } from "../../token-model/model.js";
import {
  type StrokeStyleValue,
  type TokenType,
  type TokenTypeMap,
} from "../../token-model/values.js";
import {
  getEntry,
  resolveEntryValue,
  themeCombinations,
  themedEntry,
  walkAliasChain,
} from "../../token-model/alias.js";
import type { GeneratorContext } from "./context.js";
import {
  escapeString,
  formatTree,
  propertyAccess,
  setTreeValue,
  type SourceTree,
  type SourceValue,
} from "../../ts-source.js";
import { capitalize, entryPath, scaleExportsForConfig, type ScaleExport } from "./ts-source.js";

type LossReporter = (tokenPath: string[], message: string) => void;

export type MemberLookup = (memberAlias: string[]) => {
  ref?: string;
  value: TokenTypeMap[TokenType];
};

export interface ThemeTargetSpec {
  scalar(
    type: TokenType,
    value: TokenTypeMap[TokenType],
    report: LossReporter,
    path: string[],
  ): SourceValue;
  composite(
    entry: TokenEntry,
    resolved: TokenTypeMap[TokenType],
    member: MemberLookup,
    report: LossReporter,
  ): SourceValue | SourceTree;
}

const LAYERS: readonly TokenLayer[] = ["ref", "system", "components"];
const LAYER_INDEX: Record<TokenLayer, number> = Object.fromEntries(
  LAYERS.map((layer, index) => [layer, index]),
) as Record<TokenLayer, number>;

const JS_RESERVED_WORDS = new Set([
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
  "let",
  "static",
  "enum",
  "await",
  "implements",
  "package",
  "protected",
  "interface",
  "private",
  "public",
  "null",
  "true",
  "false",
]);

const IDENTIFIER_RE = /^[A-Za-z_$][\w$]*$/;
const THEME_ATTRIBUTE_RE = /^[A-Za-z][\w-]*$/;

function themeNameMessage(name: string, target: string): string {
  return `Theme name "${name}" cannot be used with the "${target}" output target: theme names must be valid TypeScript identifiers.`;
}

/** Throws on direct generator calls; plugins surface the same problem earlier through `validate`. */
export function validateThemeNames(themeNames: readonly string[], target: string): void {
  for (const name of themeNames) {
    if (!IDENTIFIER_RE.test(name)) {
      throw new Error(themeNameMessage(name, target));
    }
  }
}

/** A plugin `validate` hook reporting theme/scale identifier errors the target cannot emit. */
export function themeNameDiagnostics(
  target: string,
  extraReserved: readonly string[] = [],
): (ctx: PluginContext) => PluginDiagnostic[] {
  return (ctx) =>
    collectIdentifierErrors(ctx, target, scaleExportsForConfig(ctx), extraReserved).map(
      (message) => ({ severity: "error", message }),
    );
}

export function validateThemeAttribute(themeAttribute: string, target: string): void {
  if (!THEME_ATTRIBUTE_RE.test(themeAttribute)) {
    throw new Error(
      `themeAttribute "${themeAttribute}" cannot be used with the "${target}" output target: it must match ${THEME_ATTRIBUTE_RE}.`,
    );
  }
}

function themeConstName(themeName: string | undefined): string {
  return themeName === undefined ? "theme" : themeName;
}

function layerConstName(themeName: string | undefined, layer: TokenLayer): string {
  return `${themeConstName(themeName)}${capitalize(layer)}`;
}

function collectIdentifierErrors(
  config: GeneratorContext,
  target: string,
  scaleExports: readonly ScaleExport[],
  extraReserved: readonly string[] = [],
): string[] {
  const errors: string[] = [];
  const multiAxis = config.themes.length > 1;
  const singleAxisNames = config.themes.length === 1 ? Object.keys(config.themes[0]!.contexts) : [];

  if (!multiAxis) {
    for (const name of singleAxisNames) {
      if (!IDENTIFIER_RE.test(name)) {
        errors.push(themeNameMessage(name, target));
      }
    }
  } else if (target === "vanilla-extract") {
    for (const axis of config.themes) {
      if (!IDENTIFIER_RE.test(axis.name)) {
        errors.push(
          `Theme axis name "${axis.name}" cannot be used with the "${target}" output target: axis names must be valid TypeScript identifiers.`,
        );
      }
    }
  }

  const isThemeModuleTarget = target === "typescript" || target === "typescript-native";
  const reserved = new Set<string>([
    ...(isThemeModuleTarget
      ? multiAxis
        ? [
            "theme",
            "resolveTheme",
            "ThemeSelection",
            "Theme",
            "BaseTheme",
            "themeRef",
            "themeSystem",
            "themeComponents",
            "buildRef",
            "buildSystem",
            "buildComponents",
          ]
        : [
            "theme",
            "themes",
            "Theme",
            "ThemeName",
            "BaseTheme",
            "themeRef",
            "themeSystem",
            "themeComponents",
          ]
      : []),
    ...extraReserved,
    ...JS_RESERVED_WORDS,
  ]);

  if (isThemeModuleTarget && !multiAxis) {
    for (const name of singleAxisNames) {
      if (!IDENTIFIER_RE.test(name)) continue;
      const identifiers = [
        themeConstName(name),
        ...LAYERS.map((layer) => layerConstName(name, layer)),
      ];
      for (const identifier of identifiers) {
        if (reserved.has(identifier)) {
          errors.push(
            `Theme name "${name}" cannot be used with the "${target}" output target: identifier "${identifier}" collides with a reserved export name.`,
          );
        }
      }
      for (const identifier of identifiers) {
        reserved.add(identifier);
      }
    }
  } else if (target === "vanilla-extract") {
    if (!multiAxis) {
      for (const name of singleAxisNames) {
        if (!IDENTIFIER_RE.test(name)) continue;
        const identifier = `${name}ThemeClass`;
        if (reserved.has(identifier)) {
          errors.push(
            `Theme name "${name}" cannot be used with the "${target}" output target: identifier "${identifier}" collides with a reserved export name.`,
          );
        }
        reserved.add(identifier);
      }
    } else {
      for (const axis of config.themes) {
        if (!IDENTIFIER_RE.test(axis.name)) continue;
        const identifier = `${axis.name}Themes`;
        if (reserved.has(identifier)) {
          errors.push(
            `Theme axis name "${axis.name}" cannot be used with the "${target}" output target: identifier "${identifier}" collides with a reserved export name.`,
          );
        }
        reserved.add(identifier);
      }
    }
  }

  const groups = new Map<string, string[]>();
  for (const scale of scaleExports) {
    const path = pathKey([scale.metadata.layer, ...scale.metadata.path]);
    const list = groups.get(scale.typeName) ?? [];
    list.push(path);
    groups.set(scale.typeName, list);
    if (reserved.has(scale.exportName) || reserved.has(scale.typeName)) {
      const colliding = reserved.has(scale.exportName) ? scale.exportName : scale.typeName;
      errors.push(
        `Scale export name "${colliding}" at "${path}" collides with a reserved export name in the "${target}" output target. Rename the scale.`,
      );
    }
  }
  for (const [typeName, paths] of groups) {
    if (paths.length > 1) {
      errors.push(
        `Scale export name "${typeName}" collides between token paths ${paths.join(" and ")} with the "${target}" output target. Rename one of these scales.`,
      );
    }
  }

  return errors;
}

export function validateIdentifierGuards(
  config: GeneratorContext,
  target: string,
  scaleExports: readonly ScaleExport[],
  extraReserved: readonly string[] = [],
): void {
  const errors = collectIdentifierErrors(config, target, scaleExports, extraReserved);
  if (errors.length > 0) {
    throw new Error(errors[0]);
  }
}

// Not a `terminalEntry` (plugins/shared/alias.ts) walk: this tracks the last
// candidate in an *earlier* layer than the one being emitted, rather than
// the final entry in the chain, and can stop early on a theme override.
function resolveAliasCandidate(
  registry: TokenRegistry,
  seedPath: string[],
  startAliasPath: string[],
  override: ThemeOverride | undefined,
  emittingLayerIndex: number,
): TokenEntry | undefined {
  let candidate: TokenEntry | undefined;
  const chain = walkAliasChain(
    registry,
    getEntry(registry, startAliasPath),
    new Set([pathKey(seedPath)]),
    override,
  );

  for (const target of chain) {
    if (LAYER_INDEX[target.layer] < emittingLayerIndex) {
      candidate = target;
    }
    if (override?.has(pathKey(target.path))) {
      break;
    }
  }

  return candidate;
}

/**
 * Emits a reference to an earlier layer's constant when `aliasPath`'s chain
 * reaches one; returns false when the value has to be inlined instead.
 */
function emitAliasReference(
  tree: SourceTree,
  entry: TokenEntry,
  aliasPath: string[],
  registry: TokenRegistry,
  override: ThemeOverride | undefined,
  themeName: string | undefined,
): boolean {
  const candidate = resolveAliasCandidate(
    registry,
    entry.path,
    aliasPath,
    override,
    LAYER_INDEX[entry.layer],
  );
  if (!candidate) {
    return false;
  }
  setTreeValue(tree, entryPath(entry), {
    value: propertyAccess(layerConstName(themeName, candidate.layer), entryPath(candidate)),
    source: true,
  });
  return true;
}

function emitScalarEntry(
  tree: SourceTree,
  entry: TokenEntry,
  registry: TokenRegistry,
  override: ThemeOverride | undefined,
  themeName: string | undefined,
  spec: ThemeTargetSpec,
  report: LossReporter,
): void {
  const themed = themedEntry(entry, override);

  if (
    themed.alias &&
    emitAliasReference(tree, entry, themed.alias, registry, override, themeName)
  ) {
    return;
  }

  // Resolves to the override when there is one, else follows the alias chain.
  const value = resolveEntryValue(registry, entry, override) as TokenTypeMap[TokenType];
  setTreeValue(tree, entryPath(entry), spec.scalar(entry.$type, value, report, entry.path));
}

function emitCompositeEntry(
  tree: SourceTree,
  entry: TokenEntry,
  registry: TokenRegistry,
  override: ThemeOverride | undefined,
  themeName: string | undefined,
  spec: ThemeTargetSpec,
  report: LossReporter,
): void {
  const themed = themedEntry(entry, override);

  if (
    themed.alias &&
    emitAliasReference(tree, entry, themed.alias, registry, override, themeName)
  ) {
    return;
  }

  const resolvedValue = resolveEntryValue(registry, entry, override) as TokenTypeMap[TokenType];
  const member = (memberAlias: string[]): { ref?: string; value: TokenTypeMap[TokenType] } => {
    const target = getEntry(registry, memberAlias);
    const value = resolveEntryValue(registry, target, override) as TokenTypeMap[TokenType];
    const candidate = resolveAliasCandidate(
      registry,
      entry.path,
      memberAlias,
      override,
      LAYER_INDEX[entry.layer],
    );
    if (candidate) {
      return {
        ref: propertyAccess(layerConstName(themeName, candidate.layer), entryPath(candidate)),
        value,
      };
    }
    return { value };
  };

  const node = spec.composite(entry, resolvedValue, member, report);
  setTreeValue(tree, entryPath(entry), node);
}

function isSourceValueNode(node: SourceTree | SourceValue): node is SourceValue {
  return typeof (node as SourceValue).value === "string";
}

function sourceValueExpr(node: SourceValue): string {
  return node.source ? node.value : `'${escapeString(node.value)}'`;
}

function nodeToSourceValue(node: SourceTree | SourceValue): SourceValue {
  return isSourceValueNode(node) ? node : { value: formatTree(node, "  "), source: true };
}

function resolveMultiAxisCandidate(
  registry: TokenRegistry,
  seedPath: string[],
  startAliasPath: string[],
  override: ThemeOverride | undefined,
  emittingLayerIndex: number,
): TokenEntry | undefined {
  const chain = walkAliasChain(
    registry,
    getEntry(registry, startAliasPath),
    new Set([pathKey(seedPath)]),
    override,
  );
  for (const target of chain) {
    if (LAYER_INDEX[target.layer] < emittingLayerIndex) {
      return target;
    }
  }
  return undefined;
}

function buildSingleOverrideNode(
  entry: TokenEntry,
  registry: TokenRegistry,
  override: ThemeOverride | undefined,
  spec: ThemeTargetSpec,
  report: LossReporter,
): SourceTree | SourceValue {
  const themed = themedEntry(entry, override);
  const emittingLayerIndex = LAYER_INDEX[entry.layer];

  if (themed.alias) {
    const candidate = resolveMultiAxisCandidate(
      registry,
      entry.path,
      themed.alias,
      override,
      emittingLayerIndex,
    );
    if (candidate) {
      return {
        value: propertyAccess(candidate.layer, entryPath(candidate)),
        source: true,
      };
    }
  }

  if (!isCompositeType(entry.$type)) {
    const value = resolveEntryValue(registry, entry, override) as TokenTypeMap[TokenType];
    return spec.scalar(entry.$type, value, report, entry.path);
  }

  const resolvedValue = resolveEntryValue(registry, entry, override) as TokenTypeMap[TokenType];
  const member: MemberLookup = (memberAlias: string[]) => {
    const target = getEntry(registry, memberAlias);
    const value = resolveEntryValue(registry, target, override) as TokenTypeMap[TokenType];
    const candidate = resolveMultiAxisCandidate(
      registry,
      entry.path,
      memberAlias,
      override,
      emittingLayerIndex,
    );
    if (candidate) {
      return {
        ref: propertyAccess(candidate.layer, entryPath(candidate)),
        value,
      };
    }
    return { value };
  };

  return spec.composite(entry, resolvedValue, member, report);
}

function directReferencesOf(entry: TokenEntry): string[] {
  const refs: string[] = [];
  if (entry.alias) refs.push(pathKey(entry.alias));
  if (isCompositeType(entry.$type)) {
    for (const { member } of compositeMembers(
      entry.$type,
      entry.$value as TokenTypeMap[typeof entry.$type],
    )) {
      if (member.alias) refs.push(pathKey(member.alias));
    }
  } else if (entry.$type === "strokeStyle") {
    const stroke = entry.$value as StrokeStyleValue;
    if ("dashArray" in stroke) {
      for (const dash of stroke.dashArray) {
        if (dash.alias) refs.push(pathKey(dash.alias));
      }
    }
  }
  return refs;
}

function analyzeReachable(
  entry: TokenEntry,
  registry: TokenRegistry,
  axes: readonly ThemeAxis[],
): { relevantAxes: ThemeAxis[]; hasSameLayerDep: boolean } {
  const startKey = pathKey(entry.path);
  const visited = new Set<string>([startKey]);
  const queue = [startKey];
  let hasSameLayerDep = false;

  while (queue.length > 0) {
    const key = queue.shift()!;
    const regEntry = registry.get(key);
    if (!regEntry) continue;

    const candidates = [regEntry];
    for (const axis of axes) {
      for (const ov of Object.values(axis.contexts)) {
        if (ov.has(key)) candidates.push(themedEntry(regEntry, ov));
      }
    }

    for (const view of candidates) {
      for (const targetKey of directReferencesOf(view)) {
        const targetEntry = registry.get(targetKey);
        if (targetEntry && targetEntry.layer === entry.layer) {
          hasSameLayerDep = true;
        }
        if (!visited.has(targetKey)) {
          visited.add(targetKey);
          queue.push(targetKey);
        }
      }
    }
  }

  const relevantAxes = axes.filter((axis) =>
    Object.values(axis.contexts).some((ov) => [...ov.keys()].some((k) => visited.has(k))),
  );
  return { relevantAxes, hasSameLayerDep };
}

function foldComboValues(
  axes: readonly ThemeAxis[],
  axisIndex: number,
  prefix: Record<string, string>,
  lookup: Map<string, string>,
): string {
  if (axisIndex < 0) {
    const key = axes.map((a) => prefix[a.name]!).join("\0");
    return lookup.get(key)!;
  }
  const axis = axes[axisIndex]!;
  const defaultExpr = foldComboValues(
    axes,
    axisIndex - 1,
    { ...prefix, [axis.name]: axis.default },
    lookup,
  );
  let expr = defaultExpr;
  // Reverse context order so the first context check comes first in `cond1 ? v1 : cond2 ? v2 : default`.
  for (const contextName of Object.keys(axis.contexts).reverse()) {
    const branchExpr = foldComboValues(
      axes,
      axisIndex - 1,
      { ...prefix, [axis.name]: contextName },
      lookup,
    );
    if (branchExpr === defaultExpr) continue;
    const cond = `${propertyAccess("selection", [axis.name])} === ${JSON.stringify(contextName)}`;
    expr = `${cond} ? ${branchExpr} : ${expr}`;
  }
  return expr;
}

function mergeComboNodes(
  axes: readonly ThemeAxis[],
  combos: Array<{ selection: Record<string, string>; node: SourceTree | SourceValue }>,
): SourceTree | SourceValue {
  const first = combos[0]!.node;
  const allSameShapeTrees =
    !isSourceValueNode(first) &&
    combos.every((c) => {
      if (isSourceValueNode(c.node)) return false;
      const keysA = Object.keys(first);
      const keysB = Object.keys(c.node);
      return keysA.length === keysB.length && keysA.every((k, idx) => k === keysB[idx]);
    });

  if (allSameShapeTrees) {
    const result = Object.create(null) as SourceTree;
    for (const key of Object.keys(first)) {
      result[key] = mergeComboNodes(
        axes,
        combos.map((c) => ({
          selection: c.selection,
          node: (c.node as SourceTree)[key]!,
        })),
      );
    }
    return result;
  }

  const lookup = new Map<string, string>();
  for (const c of combos) {
    const k = axes.map((a) => c.selection[a.name]!).join("\0");
    lookup.set(k, sourceValueExpr(nodeToSourceValue(c.node)));
  }
  const folded = foldComboValues(axes, axes.length - 1, {}, lookup);
  return { value: folded, source: true };
}

function emitMultiAxisEntry(
  tree: SourceTree,
  entry: TokenEntry,
  registry: TokenRegistry,
  axes: readonly ThemeAxis[],
  spec: ThemeTargetSpec,
  report: LossReporter,
): void {
  const entryKey = pathKey(entry.path);
  const { relevantAxes, hasSameLayerDep } = analyzeReachable(entry, registry, axes);

  if (relevantAxes.length === 0) {
    setTreeValue(
      tree,
      entryPath(entry),
      buildSingleOverrideNode(entry, registry, undefined, spec, report),
    );
    return;
  }

  // Fast linear path O(overrides) when there are no same-layer alias chains or composite derived fields.
  if (!hasSameLayerDep && !isCompositeType(entry.$type)) {
    const directAxes = relevantAxes.filter((axis) =>
      Object.values(axis.contexts).some((ov) => ov.has(entryKey)),
    );
    const baseNode = buildSingleOverrideNode(entry, registry, undefined, spec, report);
    if (directAxes.length === 0) {
      setTreeValue(tree, entryPath(entry), baseNode);
      return;
    }
    const baseExpr = sourceValueExpr(nodeToSourceValue(baseNode));
    let expr = baseExpr;
    // Iterate axes in order so later axes in resolutionOrder wrap outside (checked first!).
    for (const axis of directAxes) {
      for (const [contextName, ov] of Object.entries(axis.contexts).reverse()) {
        if (!ov.has(entryKey)) continue;
        const branchExpr = sourceValueExpr(
          nodeToSourceValue(buildSingleOverrideNode(entry, registry, ov, spec, report)),
        );
        if (branchExpr === expr) continue;
        const cond = `${propertyAccess("selection", [axis.name])} === ${JSON.stringify(contextName)}`;
        expr = `${cond} ? ${branchExpr} : ${expr}`;
      }
    }
    setTreeValue(tree, entryPath(entry), { value: expr, source: true });
    return;
  }

  const combos = themeCombinations(relevantAxes).map((combo) => ({
    selection: combo.selection,
    node: buildSingleOverrideNode(entry, registry, combo.override, spec, report),
  }));
  setTreeValue(tree, entryPath(entry), mergeComboNodes(relevantAxes, combos));
}

function usesIdentifier(source: string, name: string): boolean {
  return new RegExp(`\\b${name}\\b`).test(source);
}

export function generateThemeSource(
  config: GeneratorContext,
  spec: ThemeTargetSpec,
  logger: Logger,
  target: string,
  scaleExports = scaleExportsForConfig(config),
): string {
  validateIdentifierGuards(config, target, scaleExports);

  const warned = new Set<string>();
  const report: LossReporter = (path, message) => {
    const key = `${pathKey(path)}::${message}`;
    if (warned.has(key)) return;
    warned.add(key);
    logger.warn(message);
  };

  const lines: string[] = [];

  const entriesByLayer = new Map<TokenLayer, TokenEntry[]>(LAYERS.map((layer) => [layer, []]));
  for (const entry of config.registry.values()) {
    entriesByLayer.get(entry.layer)!.push(entry);
  }

  if (config.themes.length <= 1) {
    const singleAxis = config.themes[0];
    const themeNames = singleAxis ? Object.keys(singleAxis.contexts).sort() : [];

    for (const themeName of [undefined, ...themeNames]) {
      const override = themeName ? singleAxis?.contexts[themeName] : undefined;

      for (const layer of LAYERS) {
        const tree = Object.create(null) as SourceTree;
        for (const entry of entriesByLayer.get(layer)!) {
          if (isCompositeType(entry.$type)) {
            emitCompositeEntry(tree, entry, config.registry, override, themeName, spec, report);
          } else {
            emitScalarEntry(tree, entry, config.registry, override, themeName, spec, report);
          }
        }
        lines.push(`const ${layerConstName(themeName, layer)} = ${formatTree(tree)} as const;`, "");
      }

      lines.push(
        `export const ${themeConstName(themeName)} = { ref: ${layerConstName(themeName, "ref")}, system: ${layerConstName(themeName, "system")}, components: ${layerConstName(themeName, "components")} };`,
        "",
      );
    }

    return lines.join("\n");
  }

  // Multi-axis: emit base `theme` plus O(tokens + overrides) layered resolver.
  for (const layer of LAYERS) {
    const tree = Object.create(null) as SourceTree;
    for (const entry of entriesByLayer.get(layer)!) {
      if (isCompositeType(entry.$type)) {
        emitCompositeEntry(tree, entry, config.registry, undefined, undefined, spec, report);
      } else {
        emitScalarEntry(tree, entry, config.registry, undefined, undefined, spec, report);
      }
    }
    lines.push(`const ${layerConstName(undefined, layer)} = ${formatTree(tree)} as const;`, "");
  }

  lines.push(
    `export const theme = { ref: ${layerConstName(undefined, "ref")}, system: ${layerConstName(undefined, "system")}, components: ${layerConstName(undefined, "components")} };`,
    "",
  );

  const selectionFields = config.themes.map((axis) => {
    const prop = IDENTIFIER_RE.test(axis.name) ? axis.name : JSON.stringify(axis.name);
    const union = [axis.default, ...Object.keys(axis.contexts)]
      .map((name) => JSON.stringify(name))
      .join(" | ");
    return `  ${prop}?: ${union};`;
  });

  lines.push("export type ThemeSelection = {", ...selectionFields, "};", "");

  const layerBodies: Record<TokenLayer, string> = { ref: "", system: "", components: "" };
  for (const layer of LAYERS) {
    const tree = Object.create(null) as SourceTree;
    for (const entry of entriesByLayer.get(layer)!) {
      emitMultiAxisEntry(tree, entry, config.registry, config.themes, spec, report);
    }
    layerBodies[layer] = formatTree(tree, "  ");
  }

  const refSelParam = usesIdentifier(layerBodies.ref, "selection") ? "selection" : "_selection";
  lines.push(
    `function buildRef(${refSelParam}: ThemeSelection) {`,
    `  return ${layerBodies.ref} as const;`,
    "}",
    "",
  );

  const sysRefParam = usesIdentifier(layerBodies.system, "ref") ? "ref" : "_ref";
  const sysSelParam = usesIdentifier(layerBodies.system, "selection") ? "selection" : "_selection";
  lines.push(
    `function buildSystem(${sysRefParam}: ReturnType<typeof buildRef>, ${sysSelParam}: ThemeSelection) {`,
    `  return ${layerBodies.system} as const;`,
    "}",
    "",
  );

  const compRefParam = usesIdentifier(layerBodies.components, "ref") ? "ref" : "_ref";
  const compSysParam = usesIdentifier(layerBodies.components, "system") ? "system" : "_system";
  const compSelParam = usesIdentifier(layerBodies.components, "selection")
    ? "selection"
    : "_selection";
  lines.push(
    `function buildComponents(${compRefParam}: ReturnType<typeof buildRef>, ${compSysParam}: ReturnType<typeof buildSystem>, ${compSelParam}: ThemeSelection) {`,
    `  return ${layerBodies.components} as const;`,
    "}",
    "",
    "export function resolveTheme(selection: ThemeSelection = {}) {",
    "  const ref = buildRef(selection);",
    "  const system = buildSystem(ref, selection);",
    "  const components = buildComponents(ref, system, selection);",
    "  return { ref, system, components };",
    "}",
    "",
  );

  return lines.join("\n");
}
