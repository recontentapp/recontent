import {
  expandedMembers,
  isExpandedComposite,
  type OutputFile,
  type RecontentPlugin,
  type TokenEntry,
  type TokenLayer,
  type TokenRegistry,
  type TokenTypeMap,
} from "@recontentapp/core";
import { cssVarName, serializeValueCss } from "../serialize/values.js";
import type { GeneratorContext } from "./shared/context.js";
import {
  CSS_IDENTIFIER_RE,
  validateThemeAttribute,
  validateThemeNames,
} from "./shared/theme-source.js";
import { outputPlugin } from "./factory.js";

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

export function formatRule(
  selector: string,
  declarations: Record<string, string>,
  comments: Record<string, string> = {},
): string {
  const lines = Object.entries(declarations).flatMap(([name, value]) => {
    const comment = comments[name];
    return [
      ...(comment ? [`  /* ${comment.replaceAll("*/", "*\\/")} */`] : []),
      `  ${name}: ${value};`,
    ];
  });
  return `${selector} {\n${lines.join("\n")}\n}`;
}

type LayerDeclarations = { declarations: Record<string, string>; comments: Record<string, string> };

function collectAllLayerDeclarations(
  registry: TokenRegistry,
): Record<TokenLayer, LayerDeclarations> {
  const byLayer: Record<TokenLayer, LayerDeclarations> = {
    ref: { declarations: {}, comments: {} },
    system: { declarations: {}, comments: {} },
    components: { declarations: {}, comments: {} },
  };

  for (const entry of registry.values()) {
    const bucket = byLayer[entry.layer];
    Object.assign(bucket.declarations, entryDeclarations(entry));
    if (entry.$description) {
      bucket.comments[cssVarName(entry.path)] = entry.$description;
    }
  }

  return byLayer;
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

export function themeSelectorFor(themeName: string, options: CssGeneratorOptions): string {
  if (options.themeSelector === "class") {
    return `.${themeName}`;
  }
  const themeAttribute = options.themeAttribute ?? "data-theme";
  return `[${themeAttribute}="${themeName}"]`;
}

export function generateCss(config: GeneratorContext, options: CssGeneratorOptions = {}): string {
  const { registry, themes } = config;
  const blocks: string[] = [];

  validateThemeNames(Object.keys(themes), "css", {
    pattern: CSS_IDENTIFIER_RE,
    description:
      "theme names must contain only letters, digits, underscores, and hyphens, and cannot start with a digit or hyphen",
  });
  if (options.themeAttribute !== undefined) {
    validateThemeAttribute(options.themeAttribute, "css");
  }

  const byLayer = collectAllLayerDeclarations(registry);

  if (Object.keys(byLayer.ref.declarations).length > 0) {
    blocks.push(formatRule(":root", byLayer.ref.declarations, byLayer.ref.comments));
  }

  if (Object.keys(byLayer.system.declarations).length > 0) {
    blocks.push(formatRule(":root", byLayer.system.declarations, byLayer.system.comments));
  }

  if (Object.keys(byLayer.components.declarations).length > 0) {
    blocks.push(formatRule(":root", byLayer.components.declarations, byLayer.components.comments));
  }

  // Theme blocks come last: they share `:root`'s specificity, so they must follow
  // every `:root` block to override it when the theme class sits on <html>.
  for (const [themeName, override] of Object.entries(themes)) {
    const themeDeclarations: Record<string, string> = {};
    for (const [key, overridden] of override.entries()) {
      const entry = registry.get(key);
      if (!entry) {
        throw new Error(`Theme override references an unknown token path: ${key}`);
      }
      Object.assign(
        themeDeclarations,
        themeOverrideDeclarations(entry, overridden as TokenTypeMap[typeof entry.$type]),
      );
    }
    if (Object.keys(themeDeclarations).length > 0) {
      blocks.push(formatRule(themeSelectorFor(themeName, options), themeDeclarations));
    }
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

export function css(options: CssPluginOptions): RecontentPlugin {
  return outputPlugin("recontent:css", options, generateCssFiles);
}
