import { isCompositeType } from "../../token-model/composite.js";
import { pathKey } from "../../token-model/guards.js";
import { type Logger } from "../../logger.js";
import { type PluginContext, type PluginDiagnostic } from "../types.js";
import {
  type ThemeOverride,
  type TokenEntry,
  type TokenRegistry,
} from "../../token-model/registry.js";
import { type TokenLayer } from "../../token-model/model.js";
import { type TokenType, type TokenTypeMap } from "../../token-model/values.js";
import {
  getEntry,
  resolveEntryValue,
  themedEntry,
  walkAliasChain,
} from "../../token-model/alias.js";
import type { GeneratorContext } from "./context.js";
import {
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
  const themeNames = Object.keys(config.themes);
  for (const name of themeNames) {
    if (!IDENTIFIER_RE.test(name)) {
      errors.push(themeNameMessage(name, target));
    }
  }

  const isThemeModuleTarget = target === "typescript" || target === "typescript-native";
  const reserved = new Set<string>([
    ...(isThemeModuleTarget
      ? [
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

  if (isThemeModuleTarget) {
    for (const name of themeNames) {
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

  const themeNames = Object.keys(config.themes).sort();
  const lines: string[] = [];

  const entriesByLayer = new Map<TokenLayer, TokenEntry[]>(LAYERS.map((layer) => [layer, []]));
  for (const entry of config.registry.values()) {
    entriesByLayer.get(entry.layer)!.push(entry);
  }

  for (const themeName of [undefined, ...themeNames]) {
    const override = themeName ? config.themes[themeName] : undefined;

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
