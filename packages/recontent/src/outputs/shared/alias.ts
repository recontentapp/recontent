import { pathKey, type TokenEntry, type TokenRegistry } from "@recontentapp/core";

/**
 * Follows `entry.alias` until the terminal (non-alias) entry, throwing on a
 * cycle or a missing target. `stopAt` lets a caller halt the walk early at a
 * given token path (e.g. a vanilla-extract theme override) instead of
 * resolving all the way to the root.
 */
export function terminalEntry(
  registry: TokenRegistry,
  entry: TokenEntry,
  stopAt?: (key: string) => boolean,
): TokenEntry {
  const visited = new Set<string>();
  let current = entry;

  while (current.alias) {
    const key = pathKey(current.path);
    if (visited.has(key)) {
      throw new Error(`Circular alias detected at token path: ${key}`);
    }
    visited.add(key);

    const target = registry.get(pathKey(current.alias));
    if (!target) {
      throw new Error(`Alias target not found: ${pathKey(current.alias)}`);
    }
    current = target;
    if (stopAt?.(pathKey(current.path))) {
      break;
    }
  }

  return current;
}
