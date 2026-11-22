import { compositeMembers, isCompositeType } from "./composite.js";
import { pathKey } from "./guards.js";
import {
  type ThemeOverride,
  type TokenDiagnostic,
  type TokenEntry,
  type TokenRegistry,
} from "./registry.js";
import type { StrokeStyleValue, TokenTypeMap } from "./values.js";

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

function overrideFor(ctx: AliasContext, theme?: string): ThemeOverride | undefined {
  return theme === undefined ? undefined : getThemeOverride(ctx.themes, theme);
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
  return resolveEntryValue(ctx.registry, entry, overrideFor(ctx, theme));
}

/**
 * `entry`, then each entry its alias chain leads to, ending at the terminal
 * (non-alias) entry, as `theme` sees them: a theme's override on any entry
 * along the chain replaces its value and alias. Throws on an unknown theme,
 * a broken alias or a cycle.
 */
export function aliasChain(ctx: AliasContext, entry: TokenEntry, theme?: string): TokenEntry[] {
  return [...walkAliasChain(ctx.registry, entry, undefined, overrideFor(ctx, theme))];
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

function memberAliasesOf(entry: TokenEntry): string[][] {
  const aliases: string[][] = [];
  if (isCompositeType(entry.$type)) {
    for (const { member } of compositeMembers(
      entry.$type,
      entry.$value as TokenTypeMap[typeof entry.$type],
    )) {
      if (member.alias) aliases.push(member.alias);
    }
  } else if (entry.$type === "strokeStyle") {
    const stroke = entry.$value as StrokeStyleValue;
    if ("dashArray" in stroke) {
      for (const dash of stroke.dashArray) {
        if (dash.alias) aliases.push(dash.alias);
      }
    }
  }
  return aliases;
}

export function diagnoseRegistry(
  registry: TokenRegistry,
  themes: Record<string, ThemeOverride>,
): TokenDiagnostic[] {
  const diagnostics: TokenDiagnostic[] = [];

  function checkEntry(
    entry: TokenEntry,
    verified: Set<string>,
    themeName?: string,
    override?: ThemeOverride,
  ): void {
    const startKey = pathKey(entry.path);
    if (verified.has(startKey)) return;

    const view = themedEntry(entry, override);
    if (view.alias) {
      try {
        for (const step of walkAliasChain(registry, entry, undefined, override)) {
          if (verified.has(pathKey(step.path))) break;
        }
        verified.add(startKey);
      } catch (error) {
        const diagnostic = aliasDiagnostic(error, entry, themeName);
        if (!diagnostic) throw error;
        diagnostics.push(diagnostic);
        return;
      }
    } else {
      verified.add(startKey);
    }

    const memberAliases = memberAliasesOf(view);
    for (const memberAlias of memberAliases) {
      try {
        const target = getEntry(registry, memberAlias);
        const visited = new Set<string>([startKey]);
        for (const step of walkAliasChain(registry, target, visited, override)) {
          // Check recursive composite member cycles (e.g. shadow layers / gradient stops).
          const stepKey = pathKey(step.path);
          for (const nested of memberAliasesOf(step)) {
            const nestedKey = pathKey(nested);
            if (nestedKey === startKey || nestedKey === stepKey) {
              throw new CircularAliasError(nestedKey);
            }
          }
        }
      } catch (error) {
        const diagnostic = aliasDiagnostic(error, entry, themeName);
        if (!diagnostic) throw error;
        diagnostics.push(diagnostic);
      }
    }
  }

  const baseVerified = new Set<string>();
  for (const entry of registry.values()) {
    checkEntry(entry, baseVerified);
  }

  for (const [themeName, overrides] of Object.entries(themes)) {
    const themeVerified = new Set<string>();
    for (const [key] of overrides) {
      const entry = registry.get(key);
      if (!entry) {
        diagnostics.push({
          path: key.split("."),
          message: `Theme "${themeName}" overrides unknown token "${key}"; it matches no token in the config.`,
        });
      } else {
        checkEntry(entry, themeVerified, themeName, overrides);
      }
    }
  }

  return diagnostics;
}
