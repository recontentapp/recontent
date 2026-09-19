import {
  expandedMembers,
  isExpandedComposite,
  pathKey,
  type OutputFile,
  type TokenEntry,
  type TokenRegistry,
  type TokenTypeMap,
} from "@recontentapp/core";
import { cssVarName, serializeValueCss } from "../serialize/values.js";
import type { GeneratorContext } from "./shared/context.js";

export type CssGeneratorOptions = {
  themeAttribute?: string;
  themeSelector?: "attribute" | "class";
};

function entryCssValue(entry: TokenEntry): string {
  if (entry.alias) {
    return `var(${cssVarName(entry.alias)})`;
  }
  return serializeValueCss(entry.$type, entry.$value);
}

function expandedEntryDeclarations(
  entry: TokenEntry,
  value: TokenTypeMap[typeof entry.$type],
  aliasPath?: string[],
): Record<string, string> {
  const declarations: Record<string, string> = {};

  for (const { varSuffix, type, member } of expandedMembers(
    entry.$type as "typography" | "transition",
    value as TokenTypeMap["typography"] | TokenTypeMap["transition"],
  )) {
    const varName = cssVarName([...entry.path, varSuffix]);
    if (aliasPath) {
      declarations[varName] = `var(${cssVarName([...aliasPath, varSuffix])})`;
      continue;
    }
    declarations[varName] = member.alias
      ? `var(${cssVarName(member.alias)})`
      : serializeValueCss(type, member.$value);
  }

  return declarations;
}

function entryDeclarations(entry: TokenEntry): Record<string, string> {
  if (!isExpandedComposite(entry.$type)) {
    return { [cssVarName(entry.path)]: entryCssValue(entry) };
  }

  if (entry.alias) {
    return expandedEntryDeclarations(entry, entry.$value, entry.alias);
  }

  return expandedEntryDeclarations(entry, entry.$value);
}

function formatRule(
  selector: string,
  declarations: Record<string, string>,
  comments: Record<string, string> = {},
): string {
  const lines = Object.entries(declarations).flatMap(([name, value]) => {
    const comment = comments[name];
    return [...(comment ? [`  /* ${comment} */`] : []), `  ${name}: ${value};`];
  });
  return `${selector} {\n${lines.join("\n")}\n}`;
}

function collectLayerDeclarations(
  registry: TokenRegistry,
  layer: "ref" | "system" | "components",
): { declarations: Record<string, string>; comments: Record<string, string> } {
  const declarations: Record<string, string> = {};
  const comments: Record<string, string> = {};

  for (const entry of registry.values()) {
    if (entry.layer !== layer) continue;
    Object.assign(declarations, entryDeclarations(entry));
    if (entry.$description) {
      comments[cssVarName(entry.path)] = entry.$description;
    }
  }

  return { declarations, comments };
}

function themeOverrideDeclarations(
  entry: TokenEntry,
  overridden: TokenTypeMap[typeof entry.$type],
): Record<string, string> {
  if (!isExpandedComposite(entry.$type)) {
    return {
      [cssVarName(entry.path)]: serializeValueCss(
        entry.$type,
        overridden as TokenTypeMap[typeof entry.$type],
      ),
    };
  }

  return expandedEntryDeclarations(entry, overridden);
}

function themeSelectorFor(themeName: string, options: CssGeneratorOptions): string {
  if (options.themeSelector === "class") {
    return `.${themeName}`;
  }
  const themeAttribute = options.themeAttribute ?? "data-theme";
  return `[${themeAttribute}="${themeName}"]`;
}

export function generateCss(config: GeneratorContext, options: CssGeneratorOptions = {}): string {
  const { registry, themes } = config;
  const blocks: string[] = [];

  const lightRef = collectLayerDeclarations(registry, "ref");
  if (Object.keys(lightRef.declarations).length > 0) {
    blocks.push(formatRule(":root", lightRef.declarations, lightRef.comments));
  }

  for (const [themeName, override] of Object.entries(themes)) {
    const themeDeclarations: Record<string, string> = {};
    for (const entry of registry.values()) {
      const overridden = override.get(pathKey(entry.path));
      if (overridden === undefined) continue;
      Object.assign(
        themeDeclarations,
        themeOverrideDeclarations(entry, overridden as TokenTypeMap[typeof entry.$type]),
      );
    }
    if (Object.keys(themeDeclarations).length > 0) {
      blocks.push(formatRule(themeSelectorFor(themeName, options), themeDeclarations));
    }
  }

  const system = collectLayerDeclarations(registry, "system");
  if (Object.keys(system.declarations).length > 0) {
    blocks.push(formatRule(":root", system.declarations, system.comments));
  }

  const components = collectLayerDeclarations(registry, "components");
  if (Object.keys(components.declarations).length > 0) {
    blocks.push(formatRule(":root", components.declarations, components.comments));
  }

  return blocks.join("\n\n");
}

export type CssPluginOptions = CssGeneratorOptions & {
  outDir: string;
};

export function generateCssFiles(
  config: GeneratorContext,
  options: CssPluginOptions,
): OutputFile[] {
  return [
    {
      filename: "tokens.css",
      content: generateCss(config, { themeSelector: "class", ...options }),
    },
  ];
}
