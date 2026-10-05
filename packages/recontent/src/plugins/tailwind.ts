import {
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
  /**
   * Font sizes (`dimension`) or whole typography tokens. A typography token also sets the
   * `--text-<key>--line-height`, `--letter-spacing` and `--font-weight` sub-properties, plus a
   * `font-family` `@utility`, so `leading-*` and `tracking-*` still override it.
   */
  text?: TokenGroup<"dimension" | "typography">;
  tracking?: TokenGroup<"dimension">;
  leading?: TokenGroup<"number" | "dimension">;
  ease?: TokenGroup<"cubicBezier">;
  breakpoint?: TokenGroup<"dimension">;
  container?: TokenGroup<"dimension">;
  blur?: TokenGroup<"dimension">;
  perspective?: TokenGroup<"dimension">;
  aspect?: TokenGroup<"number">;
  /** `shadow-*`. Opacity modifiers and colour utilities (`shadow-card/50`) do not apply to `var()` values. */
  shadow?: TokenGroup<"shadow">;
  insetShadow?: TokenGroup<"shadow">;
  dropShadow?: TokenGroup<"shadow">;
  textShadow?: TokenGroup<"shadow">;
};

type ThemeNamespace = keyof TailwindThemeOptions;

export type TailwindPluginOptions = CssGeneratorOptions & {
  outDir: string;
  /** Defaults to `tailwind.css`. */
  filename?: string;
  theme?: TailwindThemeOptions;
  /** Emit a `@custom-variant <theme>` per theme: `true` for every theme, or a list of theme names. Defaults to true. */
  themeVariants?: boolean | string[];
  /** Emit `--<ns>-*: initial;` to drop Tailwind's defaults: `true` for every namespace in `theme`, a list, or `"all"` for `--*: initial;`. Defaults to false. */
  resetDefaults?: boolean | "all" | ThemeNamespace[];
};

const NAMESPACES: Record<ThemeNamespace, { prefix: string; types: readonly TokenType[] }> = {
  color: { prefix: "color", types: ["color"] },
  spacing: { prefix: "spacing", types: ["dimension"] },
  radius: { prefix: "radius", types: ["dimension"] },
  font: { prefix: "font", types: ["fontFamily"] },
  fontWeight: { prefix: "font-weight", types: ["fontWeight"] },
  text: { prefix: "text", types: ["dimension", "typography"] },
  tracking: { prefix: "tracking", types: ["dimension"] },
  leading: { prefix: "leading", types: ["number", "dimension"] },
  ease: { prefix: "ease", types: ["cubicBezier"] },
  breakpoint: { prefix: "breakpoint", types: ["dimension"] },
  container: { prefix: "container", types: ["dimension"] },
  blur: { prefix: "blur", types: ["dimension"] },
  perspective: { prefix: "perspective", types: ["dimension"] },
  aspect: { prefix: "aspect", types: ["number"] },
  shadow: { prefix: "shadow", types: ["shadow"] },
  insetShadow: { prefix: "inset-shadow", types: ["shadow"] },
  dropShadow: { prefix: "drop-shadow", types: ["shadow"] },
  textShadow: { prefix: "text-shadow", types: ["shadow"] },
};

/** Tailwind's default `--container-*` keys. `max-w-*` and friends resolve `--spacing-*` before them. */
const DEFAULT_CONTAINER_KEYS = [
  "3xs",
  "2xs",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
  "7xl",
];

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

function typographyVar(entry: TokenEntry, varSuffix: string): string {
  return `var(${cssVarName([...entry.path, varSuffix])})`;
}

function buildTailwindMapping(
  registry: TokenRegistry,
  options: Pick<TailwindPluginOptions, "theme">,
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
  const typographyLeaves: { key: string; entry: TokenEntry }[] = [];
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
      themeOwners.set(name, entry.path);
      if (entry.$type === "typography") {
        // `--text-*` sub-properties keep `leading-*`, `tracking-*` and `font-*` composable with `text-<key>`.
        themeDecls[name] = typographyVar(entry, "font-size");
        themeDecls[`${name}--line-height`] = typographyVar(entry, "line-height");
        themeDecls[`${name}--letter-spacing`] = typographyVar(entry, "letter-spacing");
        themeDecls[`${name}--font-weight`] = typographyVar(entry, "font-weight");
        typographyLeaves.push({ key: leaf.key.join("-"), entry });
      } else {
        themeDecls[name] = `var(${cssVarName(entry.path)})`;
      }
    }
  }

  // `--text-*` has no font-family slot, so typography tokens add a static `text-<key>` utility for it.
  const utilityNames = new Set<string>();
  for (const { key, entry } of typographyLeaves) {
    const name = `text-${key}`;
    if (utilityNames.has(name)) {
      error(`theme.text: duplicate utility ${name}.`, entry.path);
      continue;
    }
    if (`--color-${key}` in themeDecls) {
      error(
        `theme.text: utility ${name} clashes with Tailwind's --color-${key}; rename one of the keys.`,
        entry.path,
      );
      continue;
    }
    utilityNames.add(name);
    utilities.push({
      name,
      declarations: { "font-family": typographyVar(entry, "font-family") },
    });
  }

  const containerKeys = new Set([
    ...DEFAULT_CONTAINER_KEYS,
    ...Object.keys(themeDecls)
      .filter((name) => name.startsWith("--container-"))
      .map((name) => name.slice("--container-".length)),
  ]);
  for (const name of Object.keys(themeDecls)) {
    if (!name.startsWith("--spacing-")) continue;
    const key = name.slice("--spacing-".length);
    if (!containerKeys.has(key)) continue;
    diagnostics.push({
      severity: "warning",
      message: `theme.spacing: ${name} also overrides the container size behind max-w-${key}, w-${key} and min-w-${key}; rename the key or use an arbitrary value such as max-w-[32rem].`,
      ...(themeOwners.has(name) ? { path: themeOwners.get(name)! } : {}),
    });
  }

  return { themeDecls, utilities, diagnostics };
}

function themeVariantRules(
  themeNames: string[],
  options: TailwindPluginOptions,
  cssOptions: CssGeneratorOptions,
): string[] {
  const { themeVariants = true } = options;
  if (themeVariants === false) return [];
  const selected = Array.isArray(themeVariants)
    ? themeNames.filter((name) => themeVariants.includes(name))
    : themeNames;
  return selected.map((name) => {
    const selector = themeSelectorFor(name, cssOptions);
    return `@custom-variant ${kebab(name)} (&:where(${selector}, ${selector} *));`;
  });
}

function resetNamespaces(options: TailwindPluginOptions): ThemeNamespace[] {
  const { resetDefaults, theme } = options;
  if (!resetDefaults || resetDefaults === "all") return [];
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

  blocks.push(...themeVariantRules(Object.keys(config.themes), options, cssOptions));

  const reset = resetNamespaces(options);
  if (options.resetDefaults === "all") {
    blocks.push(formatRule("@theme", { "--*": "initial" }));
  } else if (reset.length > 0) {
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
