import { stableStringify } from "../../diff/tokens.js";
import { convertValue } from "./convert.js";
import { followAliases, refExpression } from "./layers.js";
import type { ConvertedToken } from "./layers.js";
import { aliasTarget, containsAlias, isObject, lookupToken, sourceKey } from "./types.js";
import type { TokenMap, Warn } from "./types.js";

export type ModifierTokens = {
  name: string;
  default: string;
  description?: string;
  contexts: Array<{ name: string; tokens: TokenMap }>;
};

export type ThemeContext = { name: string; overrides: ConvertedToken[] };

export type ThemeAxisEmit = {
  name: string;
  default: string;
  description?: string;
  contexts: ThemeContext[];
};

class ResolveError extends Error {}

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

const THEME_NAME_RE = /^[A-Za-z_][\w-]*$/;
const RESERVED_NAMES = new Set(["__proto__", "constructor", "prototype"]);

function sanitizeThemeIdentifier(
  raw: string,
  kind: "axis" | "theme",
  used: Set<string>,
  warn: Warn,
): string {
  let name = raw.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!name || !/^[A-Za-z_]/.test(name)) {
    name = `_${name || kind}`;
  }
  if (!THEME_NAME_RE.test(name) || RESERVED_NAMES.has(name)) {
    name = `_${RESERVED_NAMES.has(name) ? name : kind}`;
  }
  const baseName = name;
  let suffix = 2;
  while (used.has(name)) {
    name = `${baseName}-${suffix++}`;
  }
  used.add(name);
  if (name !== raw) {
    warn(`Renamed DTCG ${kind} "${raw}" to "${name}" so it is a valid Recontent ${kind} name.`);
  }
  return name;
}

function aliasReferences(value: unknown): string[] {
  const reference = aliasTarget(value);
  if (reference !== undefined) return [reference];
  if (Array.isArray(value)) return value.flatMap(aliasReferences);
  if (isObject(value)) return Object.values(value).flatMap(aliasReferences);
  return [];
}

/**
 * Builds orthogonal theme axes preserving DTCG modifier structure and resolutionOrder.
 * Each non-default context only emits tokens whose definition differs from base (plus
 * system aliases collapsed through an overridden system token).
 */
export function buildThemes(
  base: TokenMap,
  baseTokens: ReadonlyMap<string, ConvertedToken>,
  modifiers: ModifierTokens[],
  warn: Warn,
): { axes: ThemeAxisEmit[]; skipped: number } {
  const axes: ThemeAxisEmit[] = [];
  const usedAxisNames = new Set<string>();
  const multipleModifiers = modifiers.length > 1;
  let skipped = 0;

  for (const mod of modifiers) {
    const axisName = sanitizeThemeIdentifier(mod.name, "axis", usedAxisNames, warn);
    const usedContextNames = new Set<string>();
    const defaultName = sanitizeThemeIdentifier(mod.default, "theme", usedContextNames, warn);
    const builtContexts: ThemeContext[] = [];

    for (const entry of mod.contexts) {
      const contextName = sanitizeThemeIdentifier(entry.name, "theme", usedContextNames, warn);
      const label = multipleModifiers ? `${axisName}=${contextName}` : contextName;
      const effective: TokenMap = new Map(base);
      for (const [key, token] of entry.tokens) {
        const baseToken = base.get(key);
        effective.set(key, {
          ...token,
          path: baseToken?.path ?? token.path,
          type: token.type ?? baseToken?.type,
        });
      }

      /**
       * The `ref` token a plain-alias `value` collapses to, as the base tokens do.
       * Anything else (a partial alias, or a target that is not a `ref` token) is
       * written as a literal instead.
       */
      const aliasedRef = (value: unknown, type: string): string | undefined => {
        const reference = aliasTarget(value);
        if (reference === undefined) return undefined;
        const followed = followAliases(effective, reference);
        if ("skip" in followed) return undefined;
        const { target } = followed;
        const isRef =
          target.type === type &&
          !containsAlias(target.value) &&
          baseTokens.get(sourceKey(target.sourcePath))?.layer === "ref";
        return isRef ? refExpression(target) : undefined;
      };

      const override = (key: string, value: unknown, type: string): ConvertedToken | undefined => {
        const alias = aliasedRef(value, type);
        if (alias !== undefined) {
          return { token: base.get(key)!, layer: baseTokens.get(key)!.layer, expr: alias };
        }
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
          warn(`Theme "${label}": skipped "${key}": ${result.skip}.`);
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
          warn(`Theme "${label}": "${key}" does not exist in the base tokens; skipping it.`);
          skipped += 1;
          continue;
        }
        if (stableStringify(token.value) === stableStringify(baseToken.value)) continue;
        // The base token was skipped, and already reported as such.
        if (!baseTokens.has(key)) continue;

        const type = token.type ?? baseToken.type;
        if (type !== baseToken.type) {
          warn(
            `Theme "${label}": "${key}" is ${type ?? "untyped"} but the base token is ${baseToken.type}; skipping it.`,
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
        warn(`Theme "${label}" does not override any base token; leaving it out.`);
        continue;
      }
      builtContexts.push({ name: contextName, overrides: [...overrides.values()] });
    }

    if (builtContexts.length > 0) {
      axes.push({
        name: axisName,
        default: defaultName,
        ...(mod.description !== undefined ? { description: mod.description } : {}),
        contexts: builtContexts,
      });
    }
  }

  return { axes, skipped };
}
