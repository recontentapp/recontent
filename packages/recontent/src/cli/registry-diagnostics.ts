import { pathKey, type TokenDiagnostic, type TokenRegistry } from "@recontentapp/core";
import {
  AliasTargetNotFoundError,
  CircularAliasError,
  walkAliasChain,
} from "../plugins/shared/alias.js";

export function diagnoseRegistry(registry: TokenRegistry): TokenDiagnostic[] {
  const diagnostics: TokenDiagnostic[] = [];

  for (const entry of registry.values()) {
    if (!entry.alias) continue;

    const entryKey = pathKey(entry.path);
    try {
      for (const _ of walkAliasChain(registry, entry));
    } catch (error) {
      if (error instanceof AliasTargetNotFoundError) {
        diagnostics.push({
          path: entry.path,
          message: `Broken alias at "${entryKey}": target "${error.key}" does not exist in the registry.`,
        });
      } else if (error instanceof CircularAliasError) {
        diagnostics.push({
          path: entry.path,
          message: `Circular alias at "${entryKey}": alias chain revisits "${error.key}".`,
        });
      } else {
        throw error;
      }
    }
  }

  return diagnostics;
}
