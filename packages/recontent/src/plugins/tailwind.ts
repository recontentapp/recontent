import { isStampedToken, pathKey } from "../token-model/guards.js";
import { type PluginContext, type PluginDiagnostic, type RecontentPlugin } from "./types.js";
import { type ScaleBinding, type TokenBinding } from "../token-model/model.js";
import { type TokenEntry, type ThemeAxis, type TokenRegistry } from "../token-model/registry.js";
import { type TokenType } from "../token-model/values.js";
import type { OutputFile } from "./shared/context.js";
import { cssVarName, serializeValueCss } from "../serialize/values.js";
import {
  contextSelectorFor,
  cssOptionDiagnostics,
  formatRule,
  generateCss,
  type CssGeneratorOptions,
} from "./css.js";
import { outputPlugin } from "./factory.js";
import type { GeneratorContext } from "./shared/context.js";

// Dot-separated CSS identifiers, e.g. `theme` or `base.tokens`.
const CSS_LAYER_NAME_RE = /^[A-Za-z_][\w-]*(?:\.[A-Za-z_][\w-]*)*$/;

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
   * `--text-<key>--line-height`, `--letter-spacing` and `--font-weight` sub-properties, plus
   * `--font-<key>` for its family, so you write `text-heading font-heading` and `leading-*`,
   * `tracking-*` and `font-*` still override it. Set `typographyUtilities` for a `text-<key>`
   * utility that also applies the family.
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
  /**
   * `shadow-*`. A shadow no theme overrides is inlined (`0px 4px 12px 0px var(--color)`), so
   * Tailwind can apply opacity modifiers and colour utilities (`shadow-card/50`, `shadow-red-500`).
   * A shadow a theme overrides stays a `var()`, where they have no effect, and gets a warning.
   */
  shadow?: TokenGroup<"shadow">;
  insetShadow?: TokenGroup<"shadow">;
  dropShadow?: TokenGroup<"shadow">;
  textShadow?: TokenGroup<"shadow">;
  duration?: TokenGroup<"duration">;
  /** Single tokens for Tailwind's `--default-*` theme keys. */
  defaults?: {
    /** `--default-font-family`. */
    font?: TokenBinding<"fontFamily">;
    /** `--default-mono-font-family`. */
    monoFont?: TokenBinding<"fontFamily">;
    /** `--default-transition-duration`. */
    transitionDuration?: TokenBinding<"duration">;
    /** `--default-transition-timing-function`. */
    transitionTimingFunction?: TokenBinding<"cubicBezier">;
  };
};

type ThemeNamespace = Exclude<keyof TailwindThemeOptions, "defaults">;

export type TailwindPluginOptions = CssGeneratorOptions & {
  outDir: string;
  /** Defaults to `tailwind.css`. */
  filename?: string;
  theme?: TailwindThemeOptions;
  /** Emit a `@custom-variant <theme>` per theme: `true` for every theme, or a list of theme names. Defaults to true. */
  themeVariants?: boolean | string[];
  /** Emit `--<ns>-*: initial;` to drop Tailwind's defaults: `true` for every namespace in `theme`, a list, or `"all"` for `--*: initial;`. Defaults to false. */
  resetDefaults?: boolean | "all" | ThemeNamespace[];
  /** Emit a `text-<key>` `@utility` that sets the family of each typography token. Defaults to false: use `--font-<key>` (`font-<key>`) instead. */
  typographyUtilities?: boolean;
  /** Wrap the generated `:root` and theme blocks in `@layer <name>`, or `false` to leave them unlayered. Defaults to `"theme"`. */
  layer?: string | false;
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
  duration: { prefix: "transition-duration", types: ["duration"] },
};

const DEFAULTS: Record<
  keyof NonNullable<TailwindThemeOptions["defaults"]>,
  { name: string; types: readonly TokenType[] }
> = {
  font: { name: "--default-font-family", types: ["fontFamily"] },
  monoFont: { name: "--default-mono-font-family", types: ["fontFamily"] },
  transitionDuration: { name: "--default-transition-duration", types: ["duration"] },
  transitionTimingFunction: {
    name: "--default-transition-timing-function",
    types: ["cubicBezier"],
  },
};

/** Namespaces whose value Tailwind rewrites to `var(--tw-shadow-color, …)` when the colour is inline. */
const SHADOW_NAMESPACES: readonly ThemeNamespace[] = [
  "shadow",
  "insetShadow",
  "dropShadow",
  "textShadow",
];

/** Tailwind v4 core variants. A theme named like one replaces it. `dark` is left out on purpose: overriding it is the point. */
const BUILTIN_VARIANTS = new Set([
  // breakpoints
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
  // structural and state pseudo-classes
  "first",
  "last",
  "only",
  "odd",
  "even",
  "first-of-type",
  "last-of-type",
  "only-of-type",
  "visited",
  "target",
  "open",
  "default",
  "checked",
  "indeterminate",
  "placeholder-shown",
  "autofill",
  "optional",
  "required",
  "valid",
  "invalid",
  "user-valid",
  "user-invalid",
  "in-range",
  "out-of-range",
  "read-only",
  "empty",
  "focus-within",
  "hover",
  "focus",
  "focus-visible",
  "active",
  "enabled",
  "disabled",
  "inert",
  "popover-open",
  // pseudo-elements
  "details-content",
  "file",
  "marker",
  "selection",
  "before",
  "after",
  "first-letter",
  "first-line",
  "placeholder",
  "backdrop",
  "starting",
  // media and feature queries
  "motion-safe",
  "motion-reduce",
  "contrast-more",
  "contrast-less",
  "forced-colors",
  "inverted-colors",
  "pointer-fine",
  "pointer-coarse",
  "pointer-none",
  "any-pointer-fine",
  "any-pointer-coarse",
  "any-pointer-none",
  "portrait",
  "landscape",
  "noscript",
  "print",
  "ltr",
  "rtl",
  // functional variants
  "group",
  "peer",
  "has",
  "not",
  "in",
  "supports",
  "aria",
  "data",
  "nth",
  "min",
  "max",
]);

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

function typographyVar(entry: TokenEntry, varSuffix: string, prefix?: string): string {
  return `var(${cssVarName([...entry.path, varSuffix], prefix)})`;
}

type ThemeVariantSpec = {
  rawName: string;
  variant: string;
  selector: string;
};

function collectThemeVariants(
  themes: readonly ThemeAxis[],
  cssOptions: CssGeneratorOptions,
): ThemeVariantSpec[] {
  const multiAxis = themes.length > 1;
  return themes.flatMap((axis) =>
    Object.keys(axis.contexts).map((contextName) => {
      const rawName = multiAxis ? `${axis.name}-${contextName}` : contextName;
      return {
        rawName,
        variant: kebab(rawName),
        selector: contextSelectorFor(axis, contextName, cssOptions, multiAxis),
      };
    }),
  );
}

function selectedVariants(
  variants: ThemeVariantSpec[],
  options: TailwindPluginOptions,
): ThemeVariantSpec[] {
  const { themeVariants = true } = options;
  if (themeVariants === false) return [];
  return Array.isArray(themeVariants)
    ? variants.filter(
        ({ rawName, variant }) =>
          themeVariants.includes(rawName) || themeVariants.includes(variant),
      )
    : variants;
}

/** True when a theme overrides the token or anything in its alias chain. */
function isThemeOverridden(
  entry: TokenEntry,
  registry: TokenRegistry,
  overridden: Set<string>,
): boolean {
  const seen = new Set<TokenEntry>();
  let current: TokenEntry | undefined = entry;
  while (current && !seen.has(current)) {
    if (overridden.has(pathKey(current.path))) return true;
    seen.add(current);
    current = current.alias ? registry.get(pathKey(current.alias)) : undefined;
  }
  return false;
}

function buildTailwindMapping(
  registry: TokenRegistry,
  themes: readonly ThemeAxis[],
  options: TailwindPluginOptions,
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

  const overriddenKeys = new Set(
    themes.flatMap((axis) =>
      Object.values(axis.contexts).flatMap((override) => [...override.keys()]),
    ),
  );

  const themeOwners = new Map<string, string[]>();
  const textLeaves: { key: string; entry: TokenEntry; isTypography: boolean }[] = [];
  for (const [namespace, group] of Object.entries(options.theme ?? {}) as [string, unknown][]) {
    if (namespace === "defaults") continue;
    const spec = NAMESPACES[namespace as ThemeNamespace];
    if (!spec) {
      error(`theme: unknown namespace "${namespace}".`);
      continue;
    }
    if (group === undefined) continue;
    const label = `theme.${namespace}`;
    for (const leaf of collectGroup(group)) {
      const entry = resolve(leaf, label, spec.types);
      if (!entry) continue;
      if (leaf.key.length === 0 && namespace !== "spacing") {
        error(`${label}: a bare token has no key; wrap it, e.g. { name: token }.`, entry.path);
        continue;
      }
      const name = ["--" + spec.prefix, ...leaf.key].join("-");
      // `--text-*` has no font-family slot, so typography also claims the native `--font-<key>`.
      const fontName = entry.$type === "typography" ? `--font-${leaf.key.join("-")}` : undefined;
      const clash = [name, ...(fontName ? [fontName] : [])].find((n) => n in themeDecls);
      if (clash) {
        error(
          `${label}: ${clash} is produced by both ${themeOwners.get(clash)?.join(".")} and ${entry.path.join(".")}.`,
          entry.path,
        );
        continue;
      }
      themeOwners.set(name, entry.path);
      if (entry.$type === "typography") {
        // `--text-*` sub-properties keep `leading-*` and `tracking-*` composable with `text-<key>`.
        themeDecls[name] = typographyVar(entry, "font-size", options.prefix);
        themeDecls[`${name}--line-height`] = typographyVar(entry, "line-height", options.prefix);
        themeDecls[`${name}--letter-spacing`] = typographyVar(
          entry,
          "letter-spacing",
          options.prefix,
        );
        themeDecls[`${name}--font-weight`] = typographyVar(entry, "font-weight", options.prefix);
        themeDecls[fontName!] = typographyVar(entry, "font-family", options.prefix);
        themeOwners.set(fontName!, entry.path);
        textLeaves.push({ key: leaf.key.join("-"), entry, isTypography: true });
      } else if (SHADOW_NAMESPACES.includes(namespace as ThemeNamespace)) {
        if (isThemeOverridden(entry, registry, overriddenKeys)) {
          themeDecls[name] = `var(${cssVarName(entry.path, options.prefix)})`;
          diagnostics.push({
            severity: "warning",
            message: `${label}: ${name} stays a var() because a theme overrides it, so opacity and color modifiers (e.g. ${spec.prefix}-${leaf.key.join("-")}/50) have no effect on it.`,
            path: entry.path,
          });
        } else {
          themeDecls[name] = serializeValueCss("shadow", entry.$value as never, options.prefix);
        }
      } else {
        themeDecls[name] = `var(${cssVarName(entry.path, options.prefix)})`;
        if (namespace === "text") {
          textLeaves.push({ key: leaf.key.join("-"), entry, isTypography: false });
        }
      }
    }
  }

  for (const [key, token] of Object.entries(options.theme?.defaults ?? {})) {
    const spec = DEFAULTS[key as keyof typeof DEFAULTS];
    if (!spec) {
      error(`theme.defaults: unknown default "${key}".`);
      continue;
    }
    if (token === undefined) continue;
    const entry = resolve({ key: [], token }, `theme.defaults.${key}`, spec.types);
    if (entry) themeDecls[spec.name] = `var(${cssVarName(entry.path, options.prefix)})`;
  }

  if (Array.isArray(options.resetDefaults)) {
    for (const namespace of options.resetDefaults) {
      if (!(namespace in NAMESPACES)) {
        error(`resetDefaults: unknown namespace "${String(namespace)}".`);
      }
    }
  }

  if (
    options.layer !== undefined &&
    options.layer !== false &&
    !CSS_LAYER_NAME_RE.test(options.layer)
  ) {
    error(`Invalid tailwind layer "${options.layer}": expected a CSS identifier such as "theme".`);
  }

  const cssOptions: CssGeneratorOptions = {
    ...options,
    themeSelector: options.themeSelector ?? "class",
  };
  const allVariants = collectThemeVariants(themes, cssOptions);
  const knownVariantNames = new Set(allVariants.flatMap((v) => [v.rawName, v.variant]));

  if (Array.isArray(options.themeVariants)) {
    const seenRequested = new Set<string>();
    for (const name of options.themeVariants) {
      if (seenRequested.has(name)) {
        diagnostics.push({
          severity: "warning",
          message: `themeVariants: duplicate variant "${name}".`,
        });
        continue;
      }
      seenRequested.add(name);
      if (!knownVariantNames.has(name)) {
        diagnostics.push({
          severity: "warning",
          message: `themeVariants: theme "${name}" is not defined in the config.`,
        });
      }
    }
  }

  // Tailwind's native `text-<key>` sets both the colour (`--color-<key>`) and the size (`--text-<key>`).
  const utilityNames = new Set<string>();
  for (const { key, entry, isTypography } of textLeaves) {
    const name = `text-${key}`;
    if (`--color-${key}` in themeDecls) {
      error(
        `theme.text: ${name} is ambiguous with Tailwind's --color-${key}; rename one of the keys.`,
        entry.path,
      );
      continue;
    }
    if (!isTypography || !options.typographyUtilities) continue;
    if (utilityNames.has(name)) {
      error(`theme.text: duplicate utility ${name}.`, entry.path);
      continue;
    }
    utilityNames.add(name);
    utilities.push({
      name,
      declarations: { "font-family": typographyVar(entry, "font-family", options.prefix) },
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

  const seenVariants = new Map<string, string>();
  for (const { rawName, variant } of selectedVariants(allVariants, options)) {
    const previous = seenVariants.get(variant);
    if (previous) {
      error(
        `themeVariants: themes "${previous}" and "${rawName}" both normalize to @custom-variant ${variant}; rename one or exclude it from themeVariants.`,
      );
      continue;
    }
    seenVariants.set(variant, rawName);
    if (BUILTIN_VARIANTS.has(variant)) {
      diagnostics.push({
        severity: "warning",
        message: `themeVariants: the "${rawName}" theme variant replaces Tailwind's built-in ${variant}: variant; rename the theme or leave it out of themeVariants.`,
      });
    }
  }

  return { themeDecls, utilities, diagnostics };
}

function themeVariantRules(
  themes: readonly ThemeAxis[],
  options: TailwindPluginOptions,
  cssOptions: CssGeneratorOptions,
): string[] {
  return selectedVariants(collectThemeVariants(themes, cssOptions), options).map(
    ({ variant, selector }) => `@custom-variant ${variant} (&:where(${selector}, ${selector} *));`,
  );
}

function resetNamespaces(options: TailwindPluginOptions): ThemeNamespace[] {
  const { resetDefaults, theme } = options;
  if (!resetDefaults || resetDefaults === "all") return [];
  if (Array.isArray(resetDefaults)) return resetDefaults;
  return (Object.keys(theme ?? {}) as ThemeNamespace[]).filter(
    (namespace) => namespace in NAMESPACES && theme?.[namespace] !== undefined,
  );
}

export function generateTailwindFiles(
  config: GeneratorContext,
  options: TailwindPluginOptions,
  precomputed?: TailwindMapping,
): OutputFile[] {
  const mapping = precomputed ?? buildTailwindMapping(config.registry, config.themes, options);
  const firstError = mapping.diagnostics.find((diagnostic) => diagnostic.severity === "error");
  if (firstError) {
    throw new Error(
      `tailwind: ${firstError.message}${firstError.path ? ` (${firstError.path.join(".")})` : ""}`,
    );
  }

  const cssOptions: CssGeneratorOptions = {
    ...options,
    themeSelector: options.themeSelector ?? "class",
  };
  const blocks: string[] = ['/* Generated by recontent. Import after `@import "tailwindcss";` */'];

  blocks.push(...themeVariantRules(config.themes, options, cssOptions));

  const reset = resetNamespaces(options);
  if (options.resetDefaults === "all") {
    blocks.push(formatRule("@theme", { "--*": "initial" }));
  } else if (reset.length > 0) {
    const declarations = Object.fromEntries(
      reset.map((namespace) => [`--${NAMESPACES[namespace].prefix}-*`, "initial"]),
    );
    blocks.push(formatRule("@theme", declarations));
  }

  const base = generateCss(config, cssOptions).trimEnd();
  if (base) {
    const { layer = "theme" } = options;
    if (layer !== false && !CSS_LAYER_NAME_RE.test(layer)) {
      throw new Error(
        `Invalid tailwind layer "${layer}": expected a CSS identifier such as "theme".`,
      );
    }
    blocks.push(layer === false ? base : `@layer ${layer} {\n${base.replace(/^(?=.)/gm, "  ")}\n}`);
  }

  if (Object.keys(mapping.themeDecls).length > 0) {
    blocks.push(formatRule("@theme inline", mapping.themeDecls));
  }
  for (const utility of mapping.utilities) {
    blocks.push(formatRule(`@utility ${utility.name}`, utility.declarations));
  }

  return [{ filename: options.filename ?? "tailwind.css", content: `${blocks.join("\n\n")}\n` }];
}

export function tailwind(options: TailwindPluginOptions): RecontentPlugin {
  const cache = new WeakMap<TokenRegistry, TailwindMapping>();
  const getMapping = (ctx: PluginContext) => {
    let mapping = cache.get(ctx.registry);
    if (!mapping) {
      mapping = buildTailwindMapping(ctx.registry, ctx.themes, options);
      cache.set(ctx.registry, mapping);
    }
    return mapping;
  };
  return outputPlugin(
    "recontent:tailwind",
    ["tokens"],
    options,
    (ctx, opts) => generateTailwindFiles(ctx, opts, getMapping(ctx)),
    (ctx: PluginContext) => [
      ...cssOptionDiagnostics(options, ctx?.themes ?? []),
      ...getMapping(ctx).diagnostics,
    ],
  );
}
