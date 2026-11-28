import { expandedMembers, isExpandedComposite } from "../token-model/composite.js";
import { type PluginDiagnostic, type RecontentPlugin } from "./types.js";
import {
  type ThemeAxis,
  type ThemeOverride,
  type TokenEntry,
  type TokenRegistry,
} from "../token-model/registry.js";
import { type TokenLayer } from "../token-model/model.js";
import { type GradientValue, type TokenTypeMap } from "../token-model/values.js";
import type { OutputFile } from "./shared/context.js";
import { cssVarName, serializeValueCss, type GradientResolver } from "../serialize/values.js";
import type { GeneratorContext } from "./shared/context.js";
import { validateThemeAttribute } from "./shared/theme-source.js";
import { outputPlugin } from "./factory.js";
import { getEntry, resolveEntryValue, themedEntry } from "../token-model/alias.js";

export type CssGeneratorOptions = {
  themeAttribute?: string;
  themeSelector?: "attribute" | "class";
  /** Namespaces the variables (`--<prefix>-ref-color-blue`), so they cannot collide with the host app's. Letters, digits, hyphens and underscores, starting with a letter. */
  prefix?: string;
};

const PREFIX_RE = /^[A-Za-z][A-Za-z0-9_-]*$/;

function entryCssValue(
  entry: TokenEntry,
  prefix: string | undefined,
  resolveGradient: GradientResolver,
): string {
  if (entry.alias) {
    return `var(${cssVarName(entry.alias, prefix)})`;
  }
  return serializeValueCss(entry.$type, entry.$value, prefix, resolveGradient);
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

function entryDeclarations(
  entry: TokenEntry,
  prefix: string | undefined,
  resolveGradient: GradientResolver,
): Record<string, string> {
  if (!isExpandedComposite(entry.$type)) {
    return { [cssVarName(entry.path, prefix)]: entryCssValue(entry, prefix, resolveGradient) };
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

function makeGradientResolver(registry: TokenRegistry, override?: ThemeOverride): GradientResolver {
  return (member) =>
    member.alias
      ? (resolveEntryValue(registry, getEntry(registry, member.alias), override) as GradientValue)
      : (member.$value as GradientValue);
}

function collectAllLayerDeclarations(
  registry: TokenRegistry,
  prefix?: string,
): Record<TokenLayer, LayerDeclarations> {
  const byLayer: Record<TokenLayer, LayerDeclarations> = {
    ref: { declarations: {}, comments: {} },
    system: { declarations: {}, comments: {} },
    components: { declarations: {}, comments: {} },
  };
  const owners = new Map<string, string>();
  const resolveGradient = makeGradientResolver(registry);

  for (const entry of registry.values()) {
    const bucket = byLayer[entry.layer];
    const decls = entryDeclarations(entry, prefix, resolveGradient);
    const entryPathKey = entry.path.join(".");
    for (const [varName, value] of Object.entries(decls)) {
      const existingOwner = owners.get(varName);
      if (existingOwner && existingOwner !== entryPathKey) {
        throw new Error(
          `CSS custom property collision at "${varName}": both "${existingOwner}" and "${entryPathKey}" map to it.`,
        );
      }
      owners.set(varName, entryPathKey);
      bucket.declarations[varName] = value;
    }
    if (entry.$description) {
      const firstDecl = Object.keys(decls)[0];
      if (firstDecl) {
        bucket.comments[firstDecl] = entry.$description;
      }
    }
  }

  return byLayer;
}

export function contextSelectorFor(
  axis: ThemeAxis,
  contextName: string,
  options: CssGeneratorOptions,
  multiAxis: boolean,
): string {
  if (multiAxis) {
    return options.themeSelector === "class"
      ? `.${axis.name}-${contextName}`
      : `[data-${axis.name}="${contextName}"]`;
  }
  if (options.themeSelector === "class") {
    return `.${contextName}`;
  }
  const themeAttribute =
    options.themeAttribute ?? (axis.name === "theme" ? "data-theme" : `data-${axis.name}`);
  return `[${themeAttribute}="${contextName}"]`;
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

  const selectorErrors = selectorCollisionDiagnostics(themes, options);
  if (selectorErrors.length > 0) {
    throw new Error(selectorErrors[0]!.message);
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

  // Theme blocks come last in resolutionOrder: they share `:root`'s specificity,
  // so later axes follow earlier ones and win on overlapping tokens.
  const multiAxis = themes.length > 1;
  for (const axis of themes) {
    for (const [contextName, override] of Object.entries(axis.contexts)) {
      const themeDeclarations: Record<string, string> = {};
      const resolveGradient = makeGradientResolver(registry, override);
      for (const key of override.keys()) {
        const entry = registry.get(key);
        if (!entry) {
          throw new Error(`Theme override references an unknown token path: ${key}`);
        }
        Object.assign(
          themeDeclarations,
          entryDeclarations(themedEntry(entry, override), options.prefix, resolveGradient),
        );
      }
      if (Object.keys(themeDeclarations).length > 0) {
        blocks.push(
          formatRule(contextSelectorFor(axis, contextName, options, multiAxis), themeDeclarations),
        );
      }
    }
  }

  return blocks.length > 0 ? `${blocks.join("\n\n")}\n` : "";
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

function selectorCollisionDiagnostics(
  themes: readonly ThemeAxis[],
  options: CssGeneratorOptions,
): PluginDiagnostic[] {
  if (themes.length <= 1) return [];
  const diagnostics: PluginDiagnostic[] = [];
  const seen = new Map<string, string>();
  for (const axis of themes) {
    for (const contextName of Object.keys(axis.contexts)) {
      const selector = contextSelectorFor(axis, contextName, options, true);
      const label = `${axis.name}=${contextName}`;
      const previous = seen.get(selector);
      if (previous) {
        diagnostics.push({
          severity: "error",
          message: `Theme contexts "${previous}" and "${label}" both produce CSS selector "${selector}"; rename an axis or context.`,
        });
      } else {
        seen.set(selector, label);
      }
    }
  }
  return diagnostics;
}

export function cssOptionDiagnostics(
  options: CssGeneratorOptions,
  themes: readonly ThemeAxis[] = [],
): PluginDiagnostic[] {
  const diagnostics: PluginDiagnostic[] = [...themeSelectorWarnings(options, themes)];
  if (options.prefix !== undefined && !PREFIX_RE.test(options.prefix)) {
    diagnostics.push({
      severity: "error",
      message: `prefix "${options.prefix}" cannot be used for CSS variables: it must match ${PREFIX_RE}.`,
    });
  }
  if (options.themeAttribute !== undefined) {
    try {
      validateThemeAttribute(options.themeAttribute, "css");
    } catch (error) {
      diagnostics.push({
        severity: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  diagnostics.push(
    ...selectorCollisionDiagnostics(themes, {
      ...options,
      themeSelector: options.themeSelector ?? "class",
    }),
  );
  return diagnostics;
}

/** `themeAttribute` only applies to single-axis "attribute" selectors. */
function themeSelectorWarnings(
  options: CssGeneratorOptions,
  themes: readonly ThemeAxis[],
): PluginDiagnostic[] {
  if (options.themeAttribute === undefined) return [];
  if (options.themeSelector !== "attribute") {
    return [
      {
        severity: "warning",
        message: `\`themeAttribute\` is ignored: themes are selected by class unless you set \`themeSelector: "attribute"\`.`,
      },
    ];
  }
  if (themes.length > 1) {
    return [
      {
        severity: "warning",
        message: `\`themeAttribute\` is ignored when multiple theme axes are configured: each axis uses its own \`data-<axis>\` attribute.`,
      },
    ];
  }
  return [];
}

export function css(options: CssPluginOptions): RecontentPlugin {
  return outputPlugin("recontent:css", ["tokens"], options, generateCssFiles, (ctx) =>
    cssOptionDiagnostics(options, ctx?.themes ?? []),
  );
}
