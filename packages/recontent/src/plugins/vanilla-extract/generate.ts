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
import { getEntry, terminalEntry, themedEntry } from "../../token-model/alias.js";
import type { GeneratorContext } from "../shared/context.js";
import { validateThemeNames } from "../shared/theme-source.js";
import {
  escapeTemplateLiteral,
  formatTree,
  propertyAccess,
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
  entry: TokenEntry,
  override?: ThemeOverride,
): string {
  return variableReference(terminalEntry(registry, entry, override));
}

function setExpandedComposite(
  config: GeneratorContext,
  tree: SourceTree,
  entry: TokenEntry,
  override: ThemeOverride | undefined,
): void {
  const type = entry.$type as "typography" | "transition";
  const base = [entry.layer, ...entryPath(entry)];
  const themed = themedEntry(entry, override);

  if (themed.alias) {
    const targetRef = resolveVariableReference(
      config.registry,
      getEntry(config.registry, themed.alias),
      override,
    );
    for (const { cssProperty } of expandedMembers(
      type,
      themed.$value as TokenTypeMap[typeof type],
    )) {
      setTreeValue(tree, [...base, cssProperty], {
        value: propertyAccess(targetRef, [cssProperty]),
        source: true,
      });
    }
    return;
  }

  const resolved = themed.$value as TokenTypeMap[typeof type];
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
  const themed = themedEntry(entry, override);

  if (themed.alias) {
    setTreeValue(tree, path, {
      value: resolveVariableReference(config.registry, entry, override),
      source: true,
    });
    return;
  }

  const value = themed.$value as InlineValue;
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
    const themed = themedEntry(entry, override);
    const value = themed.alias
      ? {
          value: resolveVariableReference(config.registry, entry, override),
          source: true as const,
        }
      : {
          value: serializeValueCss(entry.$type, themed.$value as TokenTypeMap[typeof entry.$type]),
        };
    setTreeValue(tree, [entry.layer, ...entryPath(entry)], value);
  }
  return tree;
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
};

export function generateVanillaExtractFiles(config: GeneratorContext): OutputFile[] {
  return [
    {
      filename: "tokens.css.ts",
      content: generateVanillaExtractSource(config, scaleExportsForConfig(config)),
    },
  ];
}
