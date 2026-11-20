import { expandedMembers, isExpandedComposite } from "../token-model/composite.js";
import { type PluginDiagnostic, type RecontentPlugin } from "./types.js";
import { type TokenEntry, type TokenRegistry } from "../token-model/registry.js";
import { type TokenLayer } from "../token-model/model.js";
import { type TokenTypeMap } from "../token-model/values.js";
import type { OutputFile } from "./shared/context.js";
import { cssVarName, serializeValueCss } from "../serialize/values.js";
import type { GeneratorContext } from "./shared/context.js";
import { validateThemeAttribute } from "./shared/theme-source.js";
import { outputPlugin } from "./factory.js";
import { themedEntry } from "../token-model/alias.js";

export type CssGeneratorOptions = {
  themeAttribute?: string;
  themeSelector?: "attribute" | "class";
  /** Namespaces the variables (`--<prefix>-ref-color-blue`), so they cannot collide with the host app's. Letters, digits, hyphens and underscores, starting with a letter. */
  prefix?: string;
};

const PREFIX_RE = /^[A-Za-z][A-Za-z0-9_-]*$/;

function entryCssValue(entry: TokenEntry, prefix?: string): string {
  if (entry.alias) {
    return `var(${cssVarName(entry.alias, prefix)})`;
  }
  return serializeValueCss(entry.$type, entry.$value, prefix);
}

function expandedEntryDeclarations(
  entry: TokenEntry,
  value: TokenTypeMap[typeof entry.$type],
  prefix: string | undefined,
  aliasPath?: string[],
): Record<string, string> {
  const declarations: Record<string, string> = {};

  for (const { varSuffix, type, member } of expandedMembers(
    entry.$type as "typography" | "transition",
    value as TokenTypeMap["typography"] | TokenTypeMap["transition"],
  )) {
    const varName = cssVarName([...entry.path, varSuffix], prefix);
    if (aliasPath) {
      declarations[varName] = `var(${cssVarName([...aliasPath, varSuffix], prefix)})`;
      continue;
    }
    declarations[varName] = member.alias
      ? `var(${cssVarName(member.alias, prefix)})`
      : serializeValueCss(type, member.$value, prefix);
  }

  return declarations;
}

function entryDeclarations(entry: TokenEntry, prefix?: string): Record<string, string> {
  if (!isExpandedComposite(entry.$type)) {
    return { [cssVarName(entry.path, prefix)]: entryCssValue(entry, prefix) };
  }

  return expandedEntryDeclarations(entry, entry.$value, prefix, entry.alias);
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
  prefix?: string,
): Record<TokenLayer, LayerDeclarations> {
  const byLayer: Record<TokenLayer, LayerDeclarations> = {
    ref: { declarations: {}, comments: {} },
    system: { declarations: {}, comments: {} },
    components: { declarations: {}, comments: {} },
  };

  for (const entry of registry.values()) {
    const bucket = byLayer[entry.layer];
    Object.assign(bucket.declarations, entryDeclarations(entry, prefix));
    if (entry.$description) {
      bucket.comments[cssVarName(entry.path, prefix)] = entry.$description;
    }
  }

  return byLayer;
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

  if (options.themeAttribute !== undefined) {
    validateThemeAttribute(options.themeAttribute, "css");
  }

  if (options.prefix !== undefined && !PREFIX_RE.test(options.prefix)) {
    throw new Error(
      `prefix "${options.prefix}" cannot be used for CSS variables: it must match ${PREFIX_RE}.`,
    );
  }

  const byLayer = collectAllLayerDeclarations(registry, options.prefix);

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
    for (const key of override.keys()) {
      const entry = registry.get(key);
      if (!entry) {
        throw new Error(`Theme override references an unknown token path: ${key}`);
      }
      Object.assign(
        themeDeclarations,
        entryDeclarations(themedEntry(entry, override), options.prefix),
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
  /** Defaults to `tokens.css`. */
  filename?: string;
};

export function generateCssFiles(
  config: GeneratorContext,
  options: CssPluginOptions,
): OutputFile[] {
  return [
    {
      filename: options.filename ?? "tokens.css",
      content: generateCss(config, { ...options, themeSelector: options.themeSelector ?? "class" }),
    },
  ];
}

/** `themeAttribute` only applies to the "attribute" selector, which is not the plugins' default. */
export function themeSelectorWarnings(options: CssGeneratorOptions): PluginDiagnostic[] {
  if (options.themeAttribute === undefined || options.themeSelector === "attribute") return [];
  return [
    {
      severity: "warning",
      message: `\`themeAttribute\` is ignored: themes are selected by class unless you set \`themeSelector: "attribute"\`.`,
    },
  ];
}

export function css(options: CssPluginOptions): RecontentPlugin {
  return {
    ...outputPlugin("recontent:css", ["tokens"], options, generateCssFiles),
    validate: () => themeSelectorWarnings(options),
  };
}
