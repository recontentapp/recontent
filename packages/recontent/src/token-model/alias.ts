import { pathKey } from "./guards.js";
import {
  type ThemeOverride,
  type TokenDiagnostic,
  type TokenEntry,
  type TokenRegistry,
} from "./registry.js";

/** Structural subset of `PluginContext` that alias resolution needs. */
type AliasContext = {
  registry: TokenRegistry;
  themes: Record<string, ThemeOverride>;
};

class AliasTargetNotFoundError extends Error {
  constructor(readonly key: string) {
    super(`Alias target not found: ${key}`);
  }
}

export class CircularAliasError extends Error {
  constructor(readonly key: string) {
    super(`Circular alias detected at token path: ${key}`);
  }
}

/** The entry at `path`, or an `AliasTargetNotFoundError` when the registry has none. */
export function getEntry(registry: TokenRegistry, path: string | string[]): TokenEntry {
  const key = typeof path === "string" ? path : pathKey(path);
  const entry = registry.get(key);
  if (!entry) {
    throw new AliasTargetNotFoundError(key);
  }
  return entry;
}

/**
 * The entry as `override` sees it: the theme's `$value` and `alias` replace the
 * entry's own, and a literal override drops the alias.
 */
export function themedEntry(entry: TokenEntry, override?: ThemeOverride): TokenEntry {
  const themed = override?.get(pathKey(entry.path));
  if (!themed) {
    return entry;
  }
  const { alias: _alias, ...rest } = entry;
  return { ...rest, $value: themed.$value, ...(themed.alias && { alias: themed.alias }) };
}

/**
 * Yields `start`, then each entry its alias chain leads to, ending at the
 * terminal (non-alias) entry. With `override`, every step is the theme's view
 * of the entry, so the walk follows the theme's aliases. Throws on a cycle or
 * a missing target when the walk reaches it, so a caller that stops early never
 * sees the problem. `visited` seeds the cycle check with keys that must not be
 * revisited.
 */
export function* walkAliasChain(
  registry: TokenRegistry,
  start: TokenEntry,
  visited = new Set<string>(),
  override?: ThemeOverride,
): Generator<TokenEntry> {
  let current = themedEntry(start, override);
  while (true) {
    const key = pathKey(current.path);
    if (visited.has(key)) {
      throw new CircularAliasError(key);
    }
    visited.add(key);
    yield current;
    if (!current.alias) {
      return;
    }
    current = themedEntry(getEntry(registry, current.alias), override);
  }
}

/** Follows `entry.alias` until the terminal (non-alias) entry, as `override` (when given) sees it. */
export function terminalEntry(
  registry: TokenRegistry,
  entry: TokenEntry,
  override?: ThemeOverride,
): TokenEntry {
  let last = entry;
  for (const current of walkAliasChain(registry, entry, undefined, override)) {
    last = current;
  }
  return last;
}

/** The entry's value after following its alias chain, as `override` (when given) sees it. */
export function resolveEntryValue(
  registry: TokenRegistry,
  entry: TokenEntry,
  override?: ThemeOverride,
): TokenEntry["$value"] {
  return terminalEntry(registry, entry, override).$value;
}

/** The named theme's overrides, or an error listing the themes the config does define. */
export function getThemeOverride(themes: AliasContext["themes"], themeName: string): ThemeOverride {
  const override = themes[themeName];
  if (!override) {
    throw new Error(
      `Theme "${themeName}" is not defined in the config. Available themes: ${Object.keys(themes).join(", ") || "(none)"}`,
    );
  }
  return override;
}

/**
 * The value of `entry` once its alias chain is followed to the end, as `theme`
 * sees it: an override on any entry along the chain wins. Without a `theme` it
 * is the base value. Throws on an unknown theme.
 */
export function resolveValue(
  ctx: AliasContext,
  entry: TokenEntry,
  theme?: string,
): TokenEntry["$value"] {
  return resolveEntryValue(
    ctx.registry,
    entry,
    theme === undefined ? undefined : getThemeOverride(ctx.themes, theme),
  );
}

function aliasDiagnostic(
  error: unknown,
  entry: TokenEntry,
  themeName?: string,
): TokenDiagnostic | undefined {
  const entryKey = pathKey(entry.path);
  const where = themeName === undefined ? "" : `Theme "${themeName}": `;
  if (error instanceof AliasTargetNotFoundError) {
    return {
      path: entry.path,
      message: `${where}Broken alias at "${entryKey}": target "${error.key}" does not exist in the registry.`,
    };
  }
  if (error instanceof CircularAliasError) {
    return {
      path: entry.path,
      message: `${where}Circular alias at "${entryKey}": alias chain revisits "${error.key}".`,
    };
  }
  return undefined;
}

export function diagnoseRegistry(
  registry: TokenRegistry,
  themes: Record<string, ThemeOverride>,
): TokenDiagnostic[] {
  const diagnostics: TokenDiagnostic[] = [];

  function check(entry: TokenEntry, themeName?: string, override?: ThemeOverride): void {
    try {
      for (const _ of walkAliasChain(registry, entry, undefined, override));
    } catch (error) {
      const diagnostic = aliasDiagnostic(error, entry, themeName);
      if (!diagnostic) throw error;
      diagnostics.push(diagnostic);
    }
  }

  for (const entry of registry.values()) {
    if (entry.alias) check(entry);
  }

  for (const [themeName, overrides] of Object.entries(themes)) {
    for (const [key, themed] of overrides) {
      const entry = registry.get(key);
      if (!entry) {
        diagnostics.push({
          path: key.split("."),
          message: `Theme "${themeName}" overrides unknown token "${key}"; it matches no token in the config.`,
        });
      } else if (themed.alias) {
        check(entry, themeName, overrides);
      }
    }
  }

  return diagnostics;
}
