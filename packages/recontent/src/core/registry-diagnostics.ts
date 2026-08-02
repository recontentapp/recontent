import {
  pathKey,
  type TokenDiagnostic,
  type TokenEntry,
  type TokenRegistry,
} from "@recontentapp/core";

export function diagnoseRegistry(registry: TokenRegistry): TokenDiagnostic[] {
  const diagnostics: TokenDiagnostic[] = [];

  for (const entry of registry.values()) {
    if (!entry.alias) continue;

    const entryKey = pathKey(entry.path);
    const seen = new Set<string>([entryKey]);
    let current: TokenEntry = entry;

    while (current.alias) {
      const aliasKey = pathKey(current.alias);
      const target = registry.get(aliasKey);
      if (!target) {
        diagnostics.push({
          path: entry.path,
          message: `Broken alias at "${entryKey}": target "${aliasKey}" does not exist in the registry.`,
        });
        break;
      }
      if (seen.has(aliasKey)) {
        diagnostics.push({
          path: entry.path,
          message: `Circular alias at "${entryKey}": alias chain revisits "${aliasKey}".`,
        });
        break;
      }
      seen.add(aliasKey);
      current = target;
    }
  }

  return diagnostics;
}
