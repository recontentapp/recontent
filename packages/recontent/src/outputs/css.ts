import type { Config, ThemeOverride, TokenEntry, TokenRegistry } from "@recontentapp/core";
import { cssVarName, serializeValueCss } from "../core/generators/serialize.js";
import type { Output, OutputFile, OutputProcessor } from "./index.js";

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

function formatRule(selector: string, declarations: Record<string, string>): string {
  const lines = Object.entries(declarations).map(([name, value]) => `  ${name}: ${value};`);
  return `${selector} {\n${lines.join("\n")}\n}`;
}

function collectRefDeclarations(
  registry: TokenRegistry,
  valueResolver: (entry: TokenEntry) => string,
): Record<string, string> {
  const declarations: Record<string, string> = {};

  for (const entry of registry.values()) {
    if (entry.layer !== "ref") continue;
    declarations[cssVarName(entry.path)] = valueResolver(entry);
  }

  return declarations;
}

function collectLayerDeclarations(
  registry: TokenRegistry,
  layer: "system" | "components",
): Record<string, string> {
  const declarations: Record<string, string> = {};

  for (const entry of registry.values()) {
    if (entry.layer !== layer) continue;
    declarations[cssVarName(entry.path)] = entryCssValue(entry);
  }

  return declarations;
}

function themeOverrideValue(entry: TokenEntry, override: ThemeOverride, pathKey: string): string {
  const overridden = override.get(pathKey);
  if (overridden) {
    return serializeValueCss(entry.$type, overridden);
  }
  if (entry.alias) {
    return `var(${cssVarName(entry.alias)})`;
  }
  return serializeValueCss(entry.$type, entry.$value);
}

function themeSelectorFor(themeName: string, options: CssGeneratorOptions): string {
  if (options.themeSelector === "class") {
    return `.${themeName}`;
  }
  const themeAttribute = options.themeAttribute ?? "data-theme";
  return `[${themeAttribute}="${themeName}"]`;
}

export function generateCss(config: Config, options: CssGeneratorOptions = {}): string {
  const { registry, themes } = config;
  const blocks: string[] = [];

  const lightRef = collectRefDeclarations(registry, (entry) =>
    entry.alias ? `var(${cssVarName(entry.alias)})` : serializeValueCss(entry.$type, entry.$value),
  );
  if (Object.keys(lightRef).length > 0) {
    blocks.push(formatRule(":root", lightRef));
  }

  for (const [themeName, override] of Object.entries(themes)) {
    const themeRef: Record<string, string> = {};
    for (const entry of registry.values()) {
      if (entry.layer !== "ref") continue;
      const key = entry.path.join(".");
      if (!override.has(key)) continue;
      themeRef[cssVarName(entry.path)] = themeOverrideValue(entry, override, key);
    }
    if (Object.keys(themeRef).length > 0) {
      blocks.push(formatRule(themeSelectorFor(themeName, options), themeRef));
    }
  }

  const system = collectLayerDeclarations(registry, "system");
  if (Object.keys(system).length > 0) {
    blocks.push(formatRule(":root", system));
  }

  const components = collectLayerDeclarations(registry, "components");
  if (Object.keys(components).length > 0) {
    blocks.push(formatRule(":root", components));
  }

  return blocks.join("\n\n");
}

export function generateCssFromRegistry(registry: TokenRegistry): string {
  return generateCss({
    registry,
    diagnostics: [],
    themes: {},
    output: [],
    logLevel: "info",
  });
}

export const cssOutputProcessor: OutputProcessor<Output> = {
  target: "css",
  generate(config: Config, _output: Output): OutputFile[] {
    return [
      {
        filename: "tokens.css",
        content: generateCss(config, { themeSelector: "class" }),
      },
    ];
  },
};
