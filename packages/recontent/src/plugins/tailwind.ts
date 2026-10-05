import {
  expandedMembers,
  isStampedToken,
  pathKey,
  type OutputFile,
  type PluginContext,
  type PluginDiagnostic,
  type RecontentPlugin,
  type ScaleBinding,
  type TokenBinding,
  type TokenEntry,
  type TokenRegistry,
  type TokenType,
} from "@recontentapp/core";
import { cssVarName } from "../serialize/values.js";
import { formatRule, generateCss, themeSelectorFor, type CssGeneratorOptions } from "./css.js";
import { outputPlugin } from "./factory.js";
import type { GeneratorContext } from "./shared/context.js";

const MAX_GROUP_DEPTH = 64;

/** A single stamped token, a scale, or a plain object nesting either. The object structure defines the Tailwind key. */
type TokenGroup<T extends TokenType> =
  | TokenBinding<T>
  | ScaleBinding<T>
  | { [key: string]: TokenGroup<T> };

type TailwindThemeOptions = {
  color?: TokenGroup<"color">;
  /** A bare token here emits Tailwind's `--spacing` base unit. */
  spacing?: TokenGroup<"dimension">;
  radius?: TokenGroup<"dimension">;
  font?: TokenGroup<"fontFamily">;
  fontWeight?: TokenGroup<"fontWeight">;
  /** Font sizes. */
  text?: TokenGroup<"dimension">;
  tracking?: TokenGroup<"dimension">;
  leading?: TokenGroup<"number" | "dimension">;
  ease?: TokenGroup<"cubicBezier">;
  breakpoint?: TokenGroup<"dimension">;
  container?: TokenGroup<"dimension">;
  blur?: TokenGroup<"dimension">;
};

type ThemeNamespace = keyof TailwindThemeOptions;

export type TailwindPluginOptions = CssGeneratorOptions & {
  outDir: string;
  /** Defaults to `tailwind.css`. */
  filename?: string;
  theme?: TailwindThemeOptions;
  utilities?: { text?: TokenGroup<"typography">; shadow?: TokenGroup<"shadow"> };
  /** Emit `@custom-variant dark` when a theme named "dark" exists. Defaults to true. */
  darkVariant?: boolean;
  /** Emit `--<ns>-*: initial;` to drop Tailwind's defaults: `true` for every namespace in `theme`, or a list. Defaults to false. */
  resetDefaults?: boolean | ThemeNamespace[];
};

const NAMESPACES: Record<ThemeNamespace, { prefix: string; types: readonly TokenType[] }> = {
  color: { prefix: "color", types: ["color"] },
  spacing: { prefix: "spacing", types: ["dimension"] },
  radius: { prefix: "radius", types: ["dimension"] },
  font: { prefix: "font", types: ["fontFamily"] },
  fontWeight: { prefix: "font-weight", types: ["fontWeight"] },
  text: { prefix: "text", types: ["dimension"] },
  tracking: { prefix: "tracking", types: ["dimension"] },
  leading: { prefix: "leading", types: ["number", "dimension"] },
  ease: { prefix: "ease", types: ["cubicBezier"] },
  breakpoint: { prefix: "breakpoint", types: ["dimension"] },
  container: { prefix: "container", types: ["dimension"] },
  blur: { prefix: "blur", types: ["dimension"] },
};

type Utility = { name: string; declarations: Record<string, string> };

type TailwindMapping = {
  themeDecls: Record<string, string>;
  utilities: Utility[];
  diagnostics: PluginDiagnostic[];
};

function kebab(segment: string): string {
  return segment.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

type Leaf = { key: string[]; token: unknown };

function collectGroup(group: unknown, key: string[] = [], depth = 0): Leaf[] {
  if (depth > MAX_GROUP_DEPTH) {
    throw new Error(
      `Tailwind token group nesting exceeds ${MAX_GROUP_DEPTH} levels at "${key.join(".")}"; check for a self-referencing object.`,
    );
  }
  if (isStampedToken(group)) {
    return [{ key, token: group }];
  }
  if (typeof group !== "object" || group === null || Array.isArray(group)) {
    return [{ key, token: group }];
  }
  return Object.entries(group).flatMap(([name, child]) =>
    collectGroup(child, [...key, kebab(name)], depth + 1),
  );
}

function buildTailwindMapping(
  registry: TokenRegistry,
  options: Pick<TailwindPluginOptions, "theme" | "utilities">,
): TailwindMapping {
  const themeDecls: Record<string, string> = {};
  const utilities: Utility[] = [];
  const diagnostics: PluginDiagnostic[] = [];
  const error = (message: string, path?: string[]) =>
    diagnostics.push({ severity: "error", message, ...(path ? { path } : {}) });

  const resolve = (leaf: Leaf, label: string, types: readonly TokenType[]): TokenEntry | null => {
    if (!isStampedToken(leaf.token)) {
      error(`${label}: expected a token${leaf.key.length ? ` at "${leaf.key.join("-")}"` : ""}.`);
      return null;
    }
    const token = leaf.token;
    const entry = registry.get(pathKey(token._path));
    if (!entry) {
      error(`${label}: token is not registered.`, token._path);
      return null;
    }
    if (!types.includes(entry.$type)) {
      error(`${label}: expected a ${types.join(" or ")} token, got ${entry.$type}.`, token._path);
      return null;
    }
    return entry;
  };

  const themeOwners = new Map<string, string[]>();
  for (const [namespace, group] of Object.entries(options.theme ?? {}) as [
    ThemeNamespace,
    unknown,
  ][]) {
    const spec = NAMESPACES[namespace];
    if (!spec || group === undefined) continue;
    const label = `theme.${namespace}`;
    for (const leaf of collectGroup(group)) {
      const entry = resolve(leaf, label, spec.types);
      if (!entry) continue;
      if (leaf.key.length === 0 && namespace !== "spacing") {
        error(`${label}: a bare token has no key; wrap it, e.g. { name: token }.`, entry.path);
        continue;
      }
      const name = ["--" + spec.prefix, ...leaf.key].join("-");
      if (name in themeDecls) {
        error(
          `${label}: ${name} is produced by both ${themeOwners.get(name)?.join(".")} and ${entry.path.join(".")}.`,
          entry.path,
        );
        continue;
      }
      themeDecls[name] = `var(${cssVarName(entry.path)})`;
      themeOwners.set(name, entry.path);
    }
  }

  const utilityNames = new Set<string>();
  const addUtility = (utility: string, leaf: Leaf, entry: TokenEntry, label: string) => {
    const name = `${utility}-${leaf.key.join("-")}`;
    if (utilityNames.has(name)) {
      error(`${label}: duplicate utility ${name}.`, entry.path);
      return false;
    }
    const key = leaf.key.join("-");
    const clashes = [`--color-${key}`, ...(utility === "text" ? [`--text-${key}`] : [])].filter(
      (varName) => varName in themeDecls,
    );
    if (clashes.length > 0) {
      error(
        `${label}: utility ${name} clashes with Tailwind's ${clashes.join(", ")}; rename one of the keys.`,
        entry.path,
      );
      return false;
    }
    utilityNames.add(name);
    return true;
  };

  const { text, shadow } = options.utilities ?? {};
  if (text !== undefined) {
    for (const leaf of collectGroup(text)) {
      const entry = resolve(leaf, "utilities.text", ["typography"]);
      if (!entry) continue;
      if (leaf.key.length === 0) {
        error(
          "utilities.text: a bare token has no key; wrap it, e.g. { name: token }.",
          entry.path,
        );
        continue;
      }
      if (!addUtility("text", leaf, entry, "utilities.text")) continue;
      const declarations: Record<string, string> = {};
      for (const { cssProperty, varSuffix } of expandedMembers(
        "typography",
        entry.$value as never,
      )) {
        declarations[cssPropertyName(cssProperty)] =
          `var(${cssVarName([...entry.path, varSuffix])})`;
      }
      utilities.push({ name: `text-${leaf.key.join("-")}`, declarations });
    }
  }
  if (shadow !== undefined) {
    for (const leaf of collectGroup(shadow)) {
      const entry = resolve(leaf, "utilities.shadow", ["shadow"]);
      if (!entry) continue;
      if (leaf.key.length === 0) {
        error(
          "utilities.shadow: a bare token has no key; wrap it, e.g. { name: token }.",
          entry.path,
        );
        continue;
      }
      if (!addUtility("shadow", leaf, entry, "utilities.shadow")) continue;
      utilities.push({
        name: `shadow-${leaf.key.join("-")}`,
        declarations: { "box-shadow": `var(${cssVarName(entry.path)})` },
      });
    }
  }

  return { themeDecls, utilities, diagnostics };
}

function cssPropertyName(property: string): string {
  return property.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

function darkVariantRule(options: CssGeneratorOptions): string {
  const selector = themeSelectorFor("dark", options);
  return `@custom-variant dark (&:where(${selector}, ${selector} *));`;
}

function resetNamespaces(options: TailwindPluginOptions): ThemeNamespace[] {
  const { resetDefaults, theme } = options;
  if (!resetDefaults) return [];
  if (Array.isArray(resetDefaults)) return resetDefaults;
  return (Object.keys(theme ?? {}) as ThemeNamespace[]).filter(
    (namespace) => theme?.[namespace] !== undefined,
  );
}

export function generateTailwindFiles(
  config: GeneratorContext,
  options: TailwindPluginOptions,
): OutputFile[] {
  const mapping = buildTailwindMapping(config.registry, options);
  const firstError = mapping.diagnostics.find((diagnostic) => diagnostic.severity === "error");
  if (firstError) {
    throw new Error(
      `tailwind: ${firstError.message}${firstError.path ? ` (${firstError.path.join(".")})` : ""}`,
    );
  }

  const cssOptions: CssGeneratorOptions = { themeSelector: "class", ...options };
  const blocks: string[] = ['/* Generated by recontent. Import after `@import "tailwindcss";` */'];

  if ((options.darkVariant ?? true) && "dark" in config.themes) {
    blocks.push(darkVariantRule(cssOptions));
  }

  const reset = resetNamespaces(options);
  if (reset.length > 0) {
    const declarations = Object.fromEntries(
      reset.map((namespace) => [`--${NAMESPACES[namespace].prefix}-*`, "initial"]),
    );
    blocks.push(formatRule("@theme", declarations));
  }

  const base = generateCss(config, cssOptions);
  if (base) blocks.push(base);

  if (Object.keys(mapping.themeDecls).length > 0) {
    blocks.push(formatRule("@theme inline", mapping.themeDecls));
  }
  for (const utility of mapping.utilities) {
    blocks.push(formatRule(`@utility ${utility.name}`, utility.declarations));
  }

  return [{ filename: options.filename ?? "tailwind.css", content: `${blocks.join("\n\n")}\n` }];
}

export function tailwind(options: TailwindPluginOptions): RecontentPlugin {
  return {
    ...outputPlugin("recontent:tailwind", options, generateTailwindFiles),
    validate: (ctx: PluginContext) => buildTailwindMapping(ctx.registry, options).diagnostics,
  };
}
