import {
  pathKey,
  type PluginContext,
  type ThemeOverride,
  type TokenEntry,
  type TokenRegistry,
} from "@recontentapp/core";

export class AliasTargetNotFoundError extends Error {
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
 * Yields `start`, then each entry its alias chain leads to, ending at the
 * terminal (non-alias) entry. Throws on a cycle or a missing target when the
 * walk reaches it, so a caller that stops early never sees the problem.
 * `visited` seeds the cycle check with keys that must not be revisited.
 */
export function* walkAliasChain(
  registry: TokenRegistry,
  start: TokenEntry,
  visited = new Set<string>(),
): Generator<TokenEntry> {
  let current = start;
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
    current = getEntry(registry, current.alias);
  }
}

/**
 * Follows `entry.alias` until the terminal (non-alias) entry. `stopAt` lets a
 * caller halt the walk early at a given token path (e.g. a vanilla-extract
 * theme override) instead of resolving all the way to the root.
 */
export function terminalEntry(
  registry: TokenRegistry,
  entry: TokenEntry,
  stopAt?: (key: string) => boolean,
): TokenEntry {
  let last = entry;
  for (const current of walkAliasChain(registry, entry)) {
    last = current;
    if (current !== entry && stopAt?.(pathKey(current.path))) {
      break;
    }
  }
  return last;
}

/**
 * The entry's value after following its alias chain; an override in `overrides`
 * wins at the first chain entry that has one.
 */
export function resolveEntryValue(
  registry: TokenRegistry,
  entry: TokenEntry,
  overrides?: ThemeOverride,
): TokenEntry["$value"] {
  let last = entry;
  for (const current of walkAliasChain(registry, entry)) {
    const overridden = overrides?.get(pathKey(current.path));
    if (overridden !== undefined) {
      return overridden;
    }
    last = current;
  }
  return last.$value;
}

/** The named theme's overrides, or an error listing the themes the config does define. */
export function getThemeOverride(
  themes: PluginContext["themes"],
  themeName: string,
): ThemeOverride {
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
  ctx: Pick<PluginContext, "registry" | "themes">,
  entry: TokenEntry,
  theme?: string,
): TokenEntry["$value"] {
  return resolveEntryValue(
    ctx.registry,
    entry,
    theme === undefined ? undefined : getThemeOverride(ctx.themes, theme),
  );
}
