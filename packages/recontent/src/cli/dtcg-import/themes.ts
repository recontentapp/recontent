import { convertValue } from "./convert.js";
import type { ConvertedToken } from "./layers.js";
import { aliasTarget, isObject, lookupToken, sourceKey } from "./types.js";
import type { TokenMap, Warn } from "./types.js";

export type ThemeContextTokens = { modifier: string; context: string; tokens: TokenMap };

export type Theme = { name: string; overrides: ConvertedToken[] };

class ResolveError extends Error {}

/** Substitutes every alias in `value` with the value it points to. */
function resolveLiteral(value: unknown, tokens: TokenMap, chain: ReadonlySet<string>): unknown {
  const reference = aliasTarget(value);
  if (reference !== undefined) {
    const target = lookupToken(tokens, reference);
    if (!target) throw new ResolveError(`alias target "{${reference}}" does not exist`);
    const key = sourceKey(target.sourcePath);
    if (chain.has(key)) throw new ResolveError(`circular alias at "${key}"`);
    return resolveLiteral(target.value, tokens, new Set(chain).add(key));
  }
  if (Array.isArray(value)) {
    // An alias to a shadow or gradient stands for all of its layers or stops.
    return value.flatMap((item) => {
      const resolved = resolveLiteral(item, tokens, chain);
      return aliasTarget(item) !== undefined && Array.isArray(resolved) ? resolved : [resolved];
    });
  }
  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveLiteral(item, tokens, chain)]),
    );
  }
  return value;
}

function themeName(entry: ThemeContextTokens, multipleModifiers: boolean): string {
  return multipleModifiers ? `${entry.modifier}-${entry.context}` : entry.context;
}

function aliasReferences(value: unknown): string[] {
  const reference = aliasTarget(value);
  if (reference !== undefined) return [reference];
  if (Array.isArray(value)) return value.flatMap(aliasReferences);
  if (isObject(value)) return Object.values(value).flatMap(aliasReferences);
  return [];
}

/**
 * Builds one theme per non-default modifier context. A path is overridden
 * when its raw definition differs from the base token's, so an alias that
 * merely follows an overridden `ref` token emits nothing: the generated
 * variables already follow it. Aliases are collapsed to their final `ref`
 * token, though, so a token that reaches an overridden `system` token only
 * through such a chain would be left behind; those get an override too.
 * Overrides are literal because `defineTheme` only keeps raw values, and sit in
 * the layer of the base token.
 */
export function buildThemes(
  base: TokenMap,
  baseTokens: ReadonlyMap<string, ConvertedToken>,
  contexts: ThemeContextTokens[],
  warn: Warn,
): { themes: Theme[]; skipped: number } {
  const multipleModifiers = new Set(contexts.map((entry) => entry.modifier)).size > 1;
  const themes: Theme[] = [];
  let skipped = 0;

  for (const entry of contexts) {
    const name = themeName(entry, multipleModifiers);
    const effective: TokenMap = new Map(base);
    for (const [key, token] of entry.tokens) {
      const baseToken = base.get(key);
      effective.set(key, { ...token, type: token.type ?? baseToken?.type });
    }

    /** Literal override for `key`, or undefined (after reporting) when it cannot be written. */
    const override = (key: string, value: unknown, type: string): ConvertedToken | undefined => {
      let result;
      try {
        const literal = resolveLiteral(value, effective, new Set([key]));
        result = convertValue(type, literal, {
          resolveMember: () => ({ skip: "unresolved alias" }),
          warn,
        });
      } catch (error) {
        if (!(error instanceof ResolveError)) throw error;
        result = { skip: error.message };
      }
      if ("skip" in result) {
        warn(`Theme "${name}": skipped "${key}": ${result.skip}.`);
        skipped += 1;
        return undefined;
      }
      const baseToken = base.get(key)!;
      return { token: baseToken, layer: baseTokens.get(key)!.layer, expr: result.expr };
    };

    const overrides = new Map<string, ConvertedToken>();
    for (const [key, token] of entry.tokens) {
      const baseToken = base.get(key);
      if (!baseToken) {
        warn(`Theme "${name}": "${key}" does not exist in the base tokens; skipping it.`);
        skipped += 1;
        continue;
      }
      if (JSON.stringify(token.value) === JSON.stringify(baseToken.value)) continue;
      // The base token was skipped, and already reported as such.
      if (!baseTokens.has(key)) continue;

      const type = token.type ?? baseToken.type;
      if (type !== baseToken.type) {
        warn(
          `Theme "${name}": "${key}" is ${type ?? "untyped"} but the base token is ${baseToken.type}; skipping it.`,
        );
        skipped += 1;
        continue;
      }
      const converted = override(key, token.value, type!);
      if (converted) overrides.set(key, converted);
    }

    // Tokens that reach an overridden system token through a collapsed alias chain.
    const changedSystem = new Set(
      [...overrides].filter(([, converted]) => converted.layer === "system").map(([key]) => key),
    );
    const reaches = new Map<string, boolean>();
    const reachesChanged = (key: string, visiting: Set<string>): boolean => {
      const known = reaches.get(key);
      if (known !== undefined) return known;
      if (visiting.has(key)) return false;
      visiting.add(key);
      const token = base.get(key);
      const found =
        token !== undefined &&
        aliasReferences(token.value).some((reference) => {
          const target = lookupToken(base, reference);
          if (!target) return false;
          const targetKey = sourceKey(target.sourcePath);
          return changedSystem.has(targetKey) || reachesChanged(targetKey, visiting);
        });
      visiting.delete(key);
      reaches.set(key, found);
      return found;
    };
    for (const [key, baseToken] of base) {
      const converted = baseTokens.get(key);
      if (!converted || converted.layer !== "system" || overrides.has(key)) continue;
      if (!reachesChanged(key, new Set())) continue;
      const dependent = override(key, baseToken.value, baseToken.type!);
      if (dependent) overrides.set(key, dependent);
    }

    if (overrides.size === 0) {
      warn(`Theme "${name}" does not override any base token; leaving it out.`);
      continue;
    }
    themes.push({ name, overrides: [...overrides.values()] });
  }

  return { themes, skipped };
}
