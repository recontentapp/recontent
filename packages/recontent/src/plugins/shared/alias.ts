import { pathKey, type TokenEntry, type TokenRegistry } from "@recontentapp/core";

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
