import {
  expandedMembers,
  isCompositeType,
  isExpandedComposite,
} from "../../token-model/composite.js";
import { type TokenEntry, type ThemeOverride } from "../../token-model/registry.js";
import { type TokenTypeMap } from "../../token-model/values.js";
import type { OutputFile } from "../shared/context.js";
import {
  serializeCompositeCss,
  serializeValueCss,
  type MemberResolver,
} from "../../serialize/values.js";
import { getEntry, resolveEntryValue, themedEntry } from "../../token-model/alias.js";
import type { GeneratorContext } from "../shared/context.js";
import { validateIdentifierGuards } from "../shared/theme-source.js";
import {
  escapeString,
  escapeTemplateLiteral,
  formatTree,
  propertyAccess,
  quotedKey,
  setTreeValue,
  type SourceTree,
} from "../../ts-source.js";
import {
  entryPath,
  generateScaleExports,
  scaleExportsForConfig,
  type ScaleExport,
} from "../shared/ts-source.js";

function variableReference(entry: TokenEntry): string {
  return propertyAccess("vars", [entry.layer, ...entryPath(entry)]);
}

function resolveVariableReference(
  registry: GeneratorContext["registry"],
  aliasPath: string[],
): string {
  return variableReference(getEntry(registry, aliasPath));
}

function setExpandedComposite(config: GeneratorContext, tree: SourceTree, entry: TokenEntry): void {
  const type = entry.$type as "typography" | "transition";
  const base = [entry.layer, ...entryPath(entry)];

  if (entry.alias) {
    const targetRef = resolveVariableReference(config.registry, entry.alias);
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

  const resolved = entry.$value as TokenTypeMap[typeof type];
  for (const { cssProperty, type: memberType, member } of expandedMembers(type, resolved)) {
    if (member.alias) {
      setTreeValue(tree, [...base, cssProperty], {
        value: resolveVariableReference(config.registry, member.alias),
        source: true,
      });
      continue;
    }
    setTreeValue(tree, [...base, cssProperty], {
      value: serializeValueCss(memberType, member.$value),
    });
  }
}

function serializeInlineCompositeExpression(
  config: GeneratorContext,
  entry: TokenEntry,
  override?: ThemeOverride,
): string {
  const type = entry.$type as "shadow" | "border" | "gradient";
  type InlineValue = TokenTypeMap["shadow"] | TokenTypeMap["border"] | TokenTypeMap["gradient"];
  const themed = themedEntry(entry, override);

  if (themed.alias) {
    return resolveVariableReference(config.registry, themed.alias);
  }

  const value = themed.$value as InlineValue;
  const resolveGradient = (member: { alias?: string[]; $value: unknown }) =>
    (member.alias
      ? resolveEntryValue(config.registry, getEntry(config.registry, member.alias), override)
      : member.$value) as TokenTypeMap["gradient"];
  const resolve: MemberResolver = (memberType, member) => {
    if (!member.alias) {
      return escapeTemplateLiteral(serializeValueCss(memberType, member.$value));
    }
    return `\${${resolveVariableReference(config.registry, member.alias)}}`;
  };
  const template = serializeCompositeCss(type, value, resolve, resolveGradient);
  return `\`${template}\``;
}

function setInlineComposite(config: GeneratorContext, tree: SourceTree, entry: TokenEntry): void {
  const path = [entry.layer, ...entryPath(entry)];
  setTreeValue(tree, path, {
    value: serializeInlineCompositeExpression(config, entry),
    source: true,
  });
}

function emptyLayerTrees(): SourceTree {
  const tree = Object.create(null) as SourceTree;
  tree.ref = Object.create(null) as SourceTree;
  tree.system = Object.create(null) as SourceTree;
  tree.components = Object.create(null) as SourceTree;
  return tree;
}

function contractTree(config: GeneratorContext): SourceTree {
  const tree = emptyLayerTrees();
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

function valuesTree(config: GeneratorContext): SourceTree {
  const tree = emptyLayerTrees();
  for (const entry of config.registry.values()) {
    if (isExpandedComposite(entry.$type)) {
      setExpandedComposite(config, tree, entry);
      continue;
    }
    if (isCompositeType(entry.$type)) {
      setInlineComposite(config, tree, entry);
      continue;
    }
    const value = entry.alias
      ? {
          value: resolveVariableReference(config.registry, entry.alias),
          source: true as const,
        }
      : {
          value: serializeValueCss(entry.$type, entry.$value as TokenTypeMap[typeof entry.$type]),
        };
    setTreeValue(tree, [entry.layer, ...entryPath(entry)], value);
  }
  return tree;
}

function formatStyleOverride(
  config: GeneratorContext,
  override: ThemeOverride,
  indent = "",
): string {
  const varEntries: Array<[string, string]> = [];
  for (const key of override.keys()) {
    const entry = config.registry.get(key);
    if (!entry) {
      throw new Error(`Theme override references an unknown token path: ${key}`);
    }
    const themed = themedEntry(entry, override);
    const varRef = variableReference(entry);

    if (isExpandedComposite(entry.$type)) {
      const type = entry.$type as "typography" | "transition";
      if (themed.alias) {
        const targetRef = resolveVariableReference(config.registry, themed.alias);
        for (const { cssProperty } of expandedMembers(
          type,
          themed.$value as TokenTypeMap[typeof type],
        )) {
          varEntries.push([
            propertyAccess(varRef, [cssProperty]),
            propertyAccess(targetRef, [cssProperty]),
          ]);
        }
      } else {
        for (const { cssProperty, type: memberType, member } of expandedMembers(
          type,
          themed.$value as TokenTypeMap[typeof type],
        )) {
          const rhs = member.alias
            ? resolveVariableReference(config.registry, member.alias)
            : `'${escapeString(serializeValueCss(memberType, member.$value))}'`;
          varEntries.push([propertyAccess(varRef, [cssProperty]), rhs]);
        }
      }
      continue;
    }

    if (isCompositeType(entry.$type)) {
      varEntries.push([varRef, serializeInlineCompositeExpression(config, entry, override)]);
      continue;
    }

    const rhs = themed.alias
      ? resolveVariableReference(config.registry, themed.alias)
      : `'${escapeString(serializeValueCss(entry.$type, themed.$value as TokenTypeMap[typeof entry.$type]))}'`;
    varEntries.push([varRef, rhs]);
  }

  if (varEntries.length === 0) {
    return `style({\n${indent}  vars: {},\n${indent}})`;
  }

  const lines = varEntries.map(([lhs, rhs]) => `${indent}    [${lhs}]: ${rhs},`);
  return `style({\n${indent}  vars: {\n${lines.join("\n")}\n${indent}  },\n${indent}})`;
}

export const VANILLA_EXTRACT_RESERVED_EXPORTS = [
  "vars",
  "refVars",
  "systemVars",
  "componentVars",
  "themeClass",
] as const;

function generateVanillaExtractSource(
  config: GeneratorContext,
  scaleExports: readonly ScaleExport[],
): string {
  validateIdentifierGuards(
    config,
    "vanilla-extract",
    scaleExports,
    VANILLA_EXTRACT_RESERVED_EXPORTS,
  );

  const imports =
    config.themes.length > 0
      ? 'import { createTheme, createThemeContract, style } from "@vanilla-extract/css";'
      : 'import { createTheme, createThemeContract } from "@vanilla-extract/css";';

  const lines = [
    imports,
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

  if (config.themes.length === 1) {
    const axis = config.themes[0]!;
    for (const contextName of Object.keys(axis.contexts).sort()) {
      const override = axis.contexts[contextName]!;
      lines.push(
        "",
        `export const ${contextName}ThemeClass = ${formatStyleOverride(config, override)};`,
      );
    }
  } else if (config.themes.length > 1) {
    // Emit axis maps in resolutionOrder so Vanilla Extract appends CSS rules in matching order.
    for (const axis of config.themes) {
      const entries = [
        `  ${quotedKey(axis.default)}: '',`,
        ...Object.entries(axis.contexts).map(
          ([contextName, override]) =>
            `  ${quotedKey(contextName)}: ${formatStyleOverride(config, override, "  ")},`,
        ),
      ];
      lines.push("", `export const ${axis.name}Themes = {\n${entries.join("\n")}\n} as const;`);
    }
  }

  return `${lines.join("\n")}\n`;
}

export type VanillaExtractPluginOptions = {
  outDir: string;
  /** Defaults to `tokens.css.ts`. */
  filename?: string;
};

export function generateVanillaExtractFiles(
  config: GeneratorContext,
  options?: VanillaExtractPluginOptions,
): OutputFile[] {
  return [
    {
      filename: options?.filename ?? "tokens.css.ts",
      content: generateVanillaExtractSource(config, scaleExportsForConfig(config)),
    },
  ];
}
