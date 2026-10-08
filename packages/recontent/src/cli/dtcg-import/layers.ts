import { propertyAccess } from "../../plugins/shared/ts-source.js";
import { convertValue, SUPPORTED_TYPES } from "./convert.js";
import type { Converted } from "./convert.js";
import { aliasTarget, containsAlias, lookupToken, sourceKey } from "./types.js";
import type { FlatToken, TokenMap, Warn } from "./types.js";

type Layer = "ref" | "system";

export type ConvertedToken = { token: FlatToken; layer: Layer; expr: string };
export type SkippedToken = { token: FlatToken; reason: string };

/**
 * Converts every token and sorts it into a layer: literal tokens go to `ref`,
 * tokens with an alias anywhere in their value go to `system`. Aliases are
 * collapsed to the final `ref` token, or, when that token is a system
 * composite, to that composite inlined with its members pointing at `ref`.
 */
export function buildLayers(
  tokens: TokenMap,
  warn: Warn,
): { converted: ConvertedToken[]; skipped: SkippedToken[] } {
  const memo = new Map<string, Converted>();
  const inProgress = new Set<string>();

  function convertToken(token: FlatToken): Converted {
    const key = sourceKey(token.sourcePath);
    const cached = memo.get(key);
    if (cached) return cached;
    if (inProgress.has(key)) return { skip: `circular alias through "${key}"` };

    inProgress.add(key);
    const result = compute(token);
    inProgress.delete(key);
    memo.set(key, result);
    return result;
  }

  function compute(token: FlatToken): Converted {
    if (token.type === undefined) return { skip: "no $type, and none could be inferred" };
    if (!SUPPORTED_TYPES.has(token.type)) return { skip: `unsupported $type "${token.type}"` };

    const reference = aliasTarget(token.value);
    if (reference !== undefined) return resolveAlias(reference, token.type);
    return convertValue(token.type, token.value, { resolveMember: resolveAlias, warn });
  }

  function resolveAlias(reference: string, expectedType: string): Converted {
    const seen = new Set<string>();
    let currentReference = reference;
    let target = lookupToken(tokens, currentReference);
    // Follow alias -> alias chains to the first token that is not a plain alias.
    while (target) {
      const next = aliasTarget(target.value);
      if (next === undefined) break;
      const key = sourceKey(target.sourcePath);
      if (seen.has(key)) return { skip: `circular alias at "${key}"` };
      seen.add(key);
      currentReference = next;
      target = lookupToken(tokens, currentReference);
    }
    if (!target) return { skip: `alias target "{${currentReference}}" does not exist` };

    if (target.type !== expectedType) {
      return {
        skip: `"{${currentReference}}" is ${target.type ?? "untyped"}, expected ${expectedType}`,
      };
    }
    const converted = convertToken(target);
    if ("skip" in converted) {
      return { skip: `alias target "{${currentReference}}" was skipped: ${converted.skip}` };
    }
    return containsAlias(target.value) ? converted : { expr: propertyAccess("ref", target.path) };
  }

  const converted: ConvertedToken[] = [];
  const skipped: SkippedToken[] = [];
  for (const token of tokens.values()) {
    const result = convertToken(token);
    if ("skip" in result) {
      skipped.push({ token, reason: result.skip });
    } else {
      converted.push({
        token,
        layer: containsAlias(token.value) ? "system" : "ref",
        expr: result.expr,
      });
    }
  }
  return { converted, skipped };
}
