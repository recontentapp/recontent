import {
  expandedMembers,
  isCompositeType,
  isExpandedComposite,
  isRawToken,
  isStampedToken,
  isTokenScale,
  type OutputFile,
  type RawToken,
  type StampedToken,
  type TokenEntry,
  type TokenLayer,
  type TokenType,
  type TokenTypeMap,
  type ThemeOverride,
  pathKey,
} from "@recontentapp/core";
import { registryComponents, type BuiltInComponentOptions } from "./registry/manifest.js";
import {
  serializeCompositeCss,
  serializeValueCss,
  type MemberResolver,
} from "../../serialize/values.js";
import {
  generateBuiltInComponentFiles,
  generateInternalModuleFiles,
  generateUseBreakpointFiles,
  getBuiltInComponentDependencies,
  formatMissingDesignTokensMessage,
  getInternalModuleDependencies,
  getUseBreakpointDependencies,
  MissingDesignTokensError,
  normalizeBuiltInComponents,
  resolveBuiltInComponentIds,
  validateBuiltInComponents,
} from "./registry/index.js";
import type { BreakpointBinding } from "./registry/types.js";
import { getEntry, terminalEntry } from "../shared/alias.js";
import type { GeneratorContext } from "../shared/context.js";
import { resetRules, type CssResetOptions } from "../shared/reset.js";
import { validateThemeNames } from "../shared/theme-source.js";
import type { ScaleBinding, TokenBinding } from "@recontentapp/core";
import {
  entryPath,
  escapeTemplateLiteral,
  formatTree,
  generateScaleExports,
  propertyAccess,
  resolveEntryValue,
  scaleExportsForConfig,
  setTreeValue,
  type ScaleExport,
  type SourceTree,
} from "../shared/ts-source.js";

function variableReference(entry: TokenEntry): string {
  return propertyAccess("vars", [entry.layer, ...entryPath(entry)]);
}

function resolveVariableReference(
  registry: GeneratorContext["registry"],
  entry: TokenEntry,
  override?: ThemeOverride,
): string {
  const current = terminalEntry(registry, entry, override && ((key) => override.has(key)));
  return variableReference(current);
}

function setExpandedComposite(
  config: GeneratorContext,
  tree: SourceTree,
  entry: TokenEntry,
  override: ThemeOverride | undefined,
): void {
  const type = entry.$type as "typography" | "transition";
  const base = [entry.layer, ...entryPath(entry)];
  const overridden = override?.get(pathKey(entry.path));

  if (overridden === undefined && entry.alias) {
    const targetRef = resolveVariableReference(
      config.registry,
      getEntry(config.registry, entry.alias),
      override,
    );
    for (const { cssProperty } of expandedMembers(
      type,
      entry.$value as TokenTypeMap[typeof type],
    )) {
      setTreeValue(tree, [...base, cssProperty], {
        value: propertyAccess(targetRef, [cssProperty]),
        source: true,
      });
    }
    return;
  }

  const resolved = (overridden ?? entry.$value) as TokenTypeMap[typeof type];
  for (const { cssProperty, type: memberType, member } of expandedMembers(type, resolved)) {
    if (member.alias) {
      setTreeValue(tree, [...base, cssProperty], {
        value: resolveVariableReference(
          config.registry,
          getEntry(config.registry, member.alias),
          override,
        ),
        source: true,
      });
      continue;
    }
    setTreeValue(tree, [...base, cssProperty], {
      value: serializeValueCss(memberType, member.$value),
    });
  }
}

function setInlineComposite(
  config: GeneratorContext,
  tree: SourceTree,
  entry: TokenEntry,
  override: ThemeOverride | undefined,
): void {
  const type = entry.$type as "shadow" | "border" | "gradient";
  const path = [entry.layer, ...entryPath(entry)];
  type InlineValue = TokenTypeMap["shadow"] | TokenTypeMap["border"] | TokenTypeMap["gradient"];
  const overridden = override?.get(pathKey(entry.path));

  if (overridden === undefined && entry.alias) {
    setTreeValue(tree, path, {
      value: resolveVariableReference(config.registry, entry, override),
      source: true,
    });
    return;
  }

  const value = (overridden ?? entry.$value) as InlineValue;
  const resolve: MemberResolver = (memberType, member) => {
    if (!member.alias) {
      return escapeTemplateLiteral(serializeValueCss(memberType, member.$value));
    }
    return `\${${resolveVariableReference(config.registry, getEntry(config.registry, member.alias), override)}}`;
  };
  const template = serializeCompositeCss(type, value, resolve);
  setTreeValue(tree, path, { value: `\`${template}\``, source: true });
}

function contractTree(config: GeneratorContext): SourceTree {
  const tree: SourceTree = { ref: {}, system: {}, components: {} };
  for (const entry of config.registry.values()) {
    if (isExpandedComposite(entry.$type)) {
      const type = entry.$type as "typography" | "transition";
      for (const { cssProperty } of expandedMembers(
        type,
        entry.$value as TokenTypeMap[typeof type],
      )) {
        setTreeValue(tree, [entry.layer, ...entryPath(entry), cssProperty], { value: "" });
      }
      continue;
    }
    setTreeValue(tree, [entry.layer, ...entryPath(entry)], { value: "" });
  }
  return tree;
}

function valuesTree(config: GeneratorContext, themeName?: string): SourceTree {
  const tree: SourceTree = { ref: {}, system: {}, components: {} };
  const override = themeName ? config.themes[themeName] : undefined;
  for (const entry of config.registry.values()) {
    if (isExpandedComposite(entry.$type)) {
      setExpandedComposite(config, tree, entry, override);
      continue;
    }
    if (isCompositeType(entry.$type)) {
      setInlineComposite(config, tree, entry, override);
      continue;
    }
    const value =
      entry.alias && !override?.has(pathKey(entry.path))
        ? {
            value: resolveVariableReference(config.registry, entry, override),
            source: true as const,
          }
        : {
            value: serializeValueCss(
              entry.$type,
              resolveEntryValue(
                config.registry,
                entry,
                override,
              ) as TokenTypeMap[typeof entry.$type],
            ),
          };
    setTreeValue(tree, [entry.layer, ...entryPath(entry)], value);
  }
  return tree;
}

function scaleExportKey(layer: TokenLayer, path: string[]): string {
  return `${layer}:${pathKey(path)}`;
}

function resolveScaleBinding<T extends TokenType>(
  scaleExportIndex: Map<string, ScaleExport>,
  scale: ScaleBinding<T>,
  expectedType: T,
  label: string,
): ScaleExport {
  if (!isTokenScale(scale) || scale.$type !== expectedType) {
    throw new Error(`Component config "${label}" must be a ${expectedType} TokenScale.`);
  }
  if (!scale._layer || !scale._path) {
    throw new Error(`Component config "${label}" must reference a defined token scale.`);
  }
  const found = scaleExportIndex.get(scaleExportKey(scale._layer, scale._path));
  if (!found) {
    throw new Error(`Component config "${label}" references a scale with no generated export.`);
  }
  return found;
}

function resolveTokenBinding<T extends TokenType>(
  registry: GeneratorContext["registry"],
  token: TokenBinding<T>,
  expectedType: T,
  label: string,
): { reference: string } {
  if (!isStampedToken(token) || token.$type !== expectedType) {
    throw new Error(`Component config "${label}" must be a ${expectedType} token.`);
  }
  const entry = registry.get(pathKey(token._path));
  if (!entry) {
    throw new Error(`Component config "${label}" references a token that is not registered.`);
  }
  // Component code preserves the path selected by the consumer. This avoids
  // rewriting a semantic system/component binding to its reference alias.
  return { reference: variableReference(entry) };
}

/**
 * Resolves the `breakpoints` output binding to literal `@media` conditions.
 * Media queries cannot read CSS custom properties, so — unlike every other
 * component binding — this does not emit a reference into `tokens.css.ts`;
 * it resolves straight to literal values at generation time and therefore
 * cannot be themed.
 */
function resolveBreakpoints(
  config: GeneratorContext,
  breakpoints: ScaleBinding<"dimension"> | undefined,
): readonly BreakpointBinding[] | undefined {
  if (breakpoints === undefined) {
    return undefined;
  }

  if (!isTokenScale(breakpoints) || breakpoints.$type !== "dimension") {
    throw new Error('Output "breakpoints" must be a dimension TokenScale.');
  }

  const entries = Object.entries(breakpoints) as Array<
    [string, RawToken<"dimension"> | StampedToken<"dimension">]
  >;
  if (entries.length === 0) {
    throw new Error('Output "breakpoints" must declare at least one breakpoint.');
  }

  for (const [name, token] of entries) {
    if (isStampedToken(token) && token._path) {
      for (const [themeName, override] of Object.entries(config.themes)) {
        if (override.has(pathKey(token._path))) {
          throw new Error(
            `Output "breakpoints.${name}" cannot be overridden by theme "${themeName}": ` +
              "breakpoints resolve to literal values baked into media queries at build time, " +
              "so they cannot vary by theme.",
          );
        }
      }
    } else if (!isRawToken(token) && !isStampedToken(token)) {
      throw new Error(`Output "breakpoints.${name}" must be a dimension token.`);
    }
  }

  const [firstName, firstToken] = entries[0]!;
  if (firstToken.$value.value !== 0) {
    throw new Error(
      `Output "breakpoints" first entry ("${firstName}") must resolve to 0 — it is the base ` +
        "condition and emits no media query.",
    );
  }

  const rest = entries.slice(1);
  const unit = rest[0]?.[1].$value.unit;
  let previousValue = firstToken.$value.value;
  for (const [name, token] of rest) {
    const { value, unit: tokenUnit } = token.$value;
    if (tokenUnit !== unit) {
      throw new Error(
        `Output "breakpoints.${name}" uses unit "${tokenUnit}", but every breakpoint after the ` +
          `base condition must share the same unit ("${unit}"). Media queries are evaluated as ` +
          "literal CSS lengths and cannot mix units meaningfully.",
      );
    }
    if (value <= previousValue) {
      throw new Error(
        `Output "breakpoints" entries must be in strictly ascending order; "${name}" ` +
          `(${value}${tokenUnit}) does not exceed the previous breakpoint (${previousValue}${tokenUnit}).`,
      );
    }
    previousValue = value;
  }

  return entries.map(([name, token], index) => ({
    name,
    query: index === 0 ? null : `screen and (min-width: ${token.$value.value}${token.$value.unit})`,
  }));
}

function generateCssResetSource(options: CssResetOptions): string {
  const lines = [
    'import { globalStyle } from "@vanilla-extract/css";',
    'import { vars } from "./tokens.css";',
    "",
  ];

  for (const rule of resetRules(options)) {
    const indent = rule.media ? "      " : "  ";
    const declarationLines = rule.declarations.map(
      ({ property, value, raw }) => `${indent}${property}: ${raw ? value : `"${value}"`},`,
    );
    const body = rule.media
      ? [`  "@media": {`, `    "${rule.media}": {`, ...declarationLines, `    },`, `  },`]
      : declarationLines;

    lines.push(`globalStyle("${rule.selector}", {`, ...body, "});", "");
  }

  return `${lines.join("\n")}`.replace(/\n+$/, "\n");
}

function generateVanillaExtractSource(
  config: GeneratorContext,
  scaleExports: readonly ScaleExport[],
): string {
  validateThemeNames(Object.keys(config.themes), "vanilla-extract");

  const lines = [
    'import { createTheme, createThemeContract } from "@vanilla-extract/css";',
    "",
    `export const vars = createThemeContract(${formatTree(contractTree(config), "", true)});`,
  ];

  // Scale export consts (e.g. `systemSpacing`) only depend on `vars`, but they are
  // reference-identical to nested slices of `refVars`/`systemVars` (e.g. `systemVars.spacing`).
  // vanilla-extract's dev-mode compiler dedupes these by identity and points the nested
  // slice at whichever declaration comes first in module order. They must therefore be
  // declared before `refVars`/`systemVars`, or the nested slice resolves to `undefined`
  // via `var` hoisting in the served module.
  for (const scale of scaleExports) {
    lines.push("", generateScaleExports(scale));
  }

  lines.push(
    "",
    "export const refVars = vars.ref;",
    "export const systemVars = vars.system;",
    "export const componentVars = vars.components;",
    "",
    `export const themeClass = createTheme(vars, ${formatTree(valuesTree(config))});`,
  );

  for (const themeName of Object.keys(config.themes).sort()) {
    lines.push(
      "",
      `export const ${themeName}ThemeClass = createTheme(vars, ${formatTree(valuesTree(config, themeName))});`,
    );
  }

  return `${lines.join("\n")}\n`;
}

export type VanillaExtractPluginOptions = {
  outDir: string;
  builtInComponents?: BuiltInComponentOptions | readonly string[];
  /** Optional. When omitted, no focus-ring styles are generated. */
  focusRingColor?: TokenBinding<"color">;
  fontFamily: TokenBinding<"fontFamily">;
  placeholderColor: TokenBinding<"color">;
  breakpoints?: ScaleBinding<"dimension">;
};

export function generateVanillaExtractFiles(
  config: GeneratorContext,
  output: VanillaExtractPluginOptions,
): OutputFile[] {
  const selection = normalizeBuiltInComponents(output.builtInComponents);
  const builtInComponents = selection.names;
  const resolvedComponentIds = resolveBuiltInComponentIds(builtInComponents);

  if (builtInComponents.length > 0) {
    const errors = validateBuiltInComponents(config, builtInComponents, selection.options);
    if (errors.length > 0) {
      throw new MissingDesignTokensError(formatMissingDesignTokensMessage(errors), errors);
    }
  }

  const resolvedBreakpoints = resolveBreakpoints(config, output.breakpoints);

  const scaleExports = scaleExportsForConfig(config);
  const scaleExportIndex = new Map(
    scaleExports.map((scaleExport) => [
      scaleExportKey(scaleExport.metadata.layer, scaleExport.metadata.path),
      scaleExport,
    ]),
  );
  const scaleBindings: Record<string, { typeName: string; exportName: string }> = {};
  const tokenBindings: Record<string, { reference: string }> = {};
  const iconBindings: Record<string, string> = {};

  for (const id of resolvedComponentIds) {
    const component = registryComponents[id];
    if (!component) continue;
    const componentOptions = (selection.options as Record<string, unknown>)[component.name] ?? {};
    for (const contract of component.contracts) {
      const binding = (componentOptions as Record<string, unknown>)[contract.key];
      if (binding === undefined) continue;
      if (contract.kind === "token") {
        tokenBindings[`${id}.${contract.key}`] = resolveTokenBinding(
          config.registry,
          binding as TokenBinding<TokenType>,
          contract.type,
          `${component.name}.${contract.key}`,
        );
      } else if (contract.kind === "scale") {
        const scale = resolveScaleBinding(
          scaleExportIndex,
          binding as ScaleBinding<TokenType>,
          contract.type,
          `${component.name}.${contract.key}`,
        );
        scaleBindings[`${id}.${contract.key}`] = {
          typeName: scale.typeName,
          exportName: scale.exportName,
        };
      } else if (contract.kind === "icon") {
        iconBindings[`${id}.${contract.key}`] = binding as string;
      } else {
        const variants = binding as Record<string, Record<string, unknown>>;
        for (const [name, variant] of Object.entries(variants)) {
          for (const field of contract.fields) {
            if (field.kind === "icon") {
              iconBindings[`${id}.${contract.key}.${name}.${field.key}`] = variant[
                field.key
              ] as string;
              continue;
            }
            tokenBindings[`${id}.${contract.key}.${name}.${field.key}`] = resolveTokenBinding(
              config.registry,
              variant[field.key] as TokenBinding<TokenType>,
              field.type,
              `${component.name}.${contract.key}.${name}.${field.key}`,
            );
          }
        }
      }
    }
  }

  const fontFamilyBinding = resolveTokenBinding(
    config.registry,
    output.fontFamily,
    "fontFamily",
    "fontFamily",
  );
  const placeholderColorBinding = resolveTokenBinding(
    config.registry,
    output.placeholderColor,
    "color",
    "placeholderColor",
  );
  const focusRingColorBinding =
    output.focusRingColor === undefined
      ? undefined
      : resolveTokenBinding(config.registry, output.focusRingColor, "color", "focusRingColor");

  const files: OutputFile[] = [
    {
      filename: "tokens.css.ts",
      content: generateVanillaExtractSource(config, scaleExports),
    },
    {
      filename: "reset.gen.css.ts",
      content: generateCssResetSource({
        fontFamily: fontFamilyBinding.reference,
        placeholderColor: placeholderColorBinding.reference,
      }),
    },
  ];
  if (builtInComponents.length > 0) {
    files.push(
      ...generateBuiltInComponentFiles(resolvedComponentIds, {
        scaleBindings,
        tokenBindings,
        iconBindings,
        breakpoints: resolvedBreakpoints,
        focusRingColor: focusRingColorBinding,
      }),
      ...generateInternalModuleFiles(resolvedComponentIds, resolvedBreakpoints, iconBindings),
      {
        filename: "components.dependencies.json",
        content: `${JSON.stringify(
          {
            ...getBuiltInComponentDependencies(resolvedComponentIds),
            ...getInternalModuleDependencies(resolvedComponentIds, resolvedBreakpoints),
            ...getUseBreakpointDependencies(resolvedBreakpoints),
          },
          null,
          2,
        )}\n`,
      },
    );
  }
  files.push(...generateUseBreakpointFiles(resolvedBreakpoints));
  return files;
}
