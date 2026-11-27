import { compositeMembers, isCompositeType } from "./composite.js";
import { pathKey } from "./guards.js";
import {
  type ThemeAxis,
  type ThemeOverride,
  type ThemeSelection,
  type TokenDiagnostic,
  type TokenEntry,
  type TokenRegistry,
} from "./registry.js";
import type { StrokeStyleValue, TokenTypeMap } from "./values.js";

/** Structural subset of `PluginContext` that alias resolution needs. */
type AliasContext = {
  registry: TokenRegistry;
  themes: readonly ThemeAxis[];
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

/**
 * Resolves a `ThemeSelection` against `axes` in `resolutionOrder`.
 * Returns `undefined` when all selected contexts are defaults (or `selection` is omitted).
 */
function resolveThemeOverride(
  axes: readonly ThemeAxis[],
  selection?: ThemeSelection,
): ThemeOverride | undefined {
  if (selection === undefined) {
    return undefined;
  }

  if (typeof selection === "string") {
    if (axes.length === 0) {
      throw new Error(
        `Theme "${selection}" is not defined in the config. Available themes: (none)`,
      );
    }
    if (axes.length > 1) {
      const exampleAxis = axes[0]!;
      const exampleContext = Object.keys(exampleAxis.contexts)[0] ?? exampleAxis.default;
      throw new Error(
        `Cannot select theme "${selection}" as a string when multiple theme axes are configured (${axes.map((a) => a.name).join(", ")}); pass an object such as { ${exampleAxis.name}: "${exampleContext}" }.`,
      );
    }
    const axis = axes[0]!;
    if (selection === axis.default) {
      return undefined;
    }
    const override = Object.hasOwn(axis.contexts, selection) ? axis.contexts[selection] : undefined;
    if (!override) {
      throw new Error(
        `Theme "${selection}" is not defined in the config. Available themes: ${Object.keys(axis.contexts).join(", ") || "(none)"}`,
      );
    }
    return override;
  }

  const axisByName = new Map(axes.map((axis) => [axis.name, axis]));
  for (const [axisName, contextName] of Object.entries(selection)) {
    const axis = axisByName.get(axisName);
    if (!axis) {
      throw new Error(
        `Theme axis "${axisName}" is not defined in the config. Available axes: ${axes.map((a) => a.name).join(", ") || "(none)"}`,
      );
    }
    if (contextName !== axis.default && !Object.hasOwn(axis.contexts, contextName)) {
      throw new Error(
        `Context "${contextName}" is not defined on theme axis "${axisName}". Available contexts: ${[axis.default, ...Object.keys(axis.contexts)].join(", ")}`,
      );
    }
  }

  const active: ThemeOverride[] = [];
  for (const axis of axes) {
    const contextName = Object.hasOwn(selection, axis.name) ? selection[axis.name] : undefined;
    if (contextName === undefined || contextName === axis.default) continue;
    active.push(axis.contexts[contextName]!);
  }

  if (active.length === 0) return undefined;
  if (active.length === 1) return active[0]!;

  const merged: ThemeOverride = new Map();
  for (const override of active) {
    for (const [key, value] of override) {
      merged.set(key, value);
    }
  }
  return merged;
}

export type ThemeCombination = {
  selection: Record<string, string>;
  label: string;
  override: ThemeOverride | undefined;
};

/**
 * Enumerates the Cartesian product of `axes` in `resolutionOrder` (starting with all defaults).
 */
export function themeCombinations(axes: readonly ThemeAxis[]): ThemeCombination[] {
  if (axes.length === 0) {
    return [{ selection: {}, label: "", override: undefined }];
  }

  let combos: Array<{ selection: Record<string, string>; activeOverrides: ThemeOverride[] }> = [
    { selection: {}, activeOverrides: [] },
  ];

  for (const axis of axes) {
    const next: typeof combos = [];
    const options = [axis.default, ...Object.keys(axis.contexts)];
    for (const prev of combos) {
      for (const contextName of options) {
        const isDefault = contextName === axis.default;
        next.push({
          selection: { ...prev.selection, [axis.name]: contextName },
          activeOverrides: isDefault
            ? prev.activeOverrides
            : [...prev.activeOverrides, axis.contexts[contextName]!],
        });
      }
    }
    combos = next;
  }

  const singleAxis = axes.length === 1;
  return combos.map(({ selection, activeOverrides }) => {
    let override: ThemeOverride | undefined;
    if (activeOverrides.length === 1) {
      override = activeOverrides[0]!;
    } else if (activeOverrides.length > 1) {
      override = new Map();
      for (const part of activeOverrides) {
        for (const [key, value] of part) {
          override.set(key, value);
        }
      }
    }
    let label = "";
    if (activeOverrides.length > 0) {
      label = singleAxis
        ? selection[axes[0]!.name]!
        : axes
            .filter((axis) => selection[axis.name] !== axis.default)
            .map((axis) => `${axis.name}=${selection[axis.name]}`)
            .join(", ");
    }
    return { selection, label, override };
  });
}

/**
 * The value of `entry` once its alias chain is followed to the end, as `theme`
 * sees it: an override on any entry along the chain wins. Without a `theme` it
 * is the base value. Throws on an unknown theme or axis.
 */
export function resolveValue(
  ctx: AliasContext,
  entry: TokenEntry,
  theme?: ThemeSelection,
): TokenEntry["$value"] {
  return resolveEntryValue(ctx.registry, entry, resolveThemeOverride(ctx.themes, theme));
}

/**
 * `entry`, then each entry its alias chain leads to, ending at the terminal
 * (non-alias) entry, as `theme` sees them: a theme's override on any entry
 * along the chain replaces its value and alias. Throws on an unknown theme,
 * a broken alias or a cycle.
 */
export function aliasChain(
  ctx: AliasContext,
  entry: TokenEntry,
  theme?: ThemeSelection,
): TokenEntry[] {
  return [
    ...walkAliasChain(ctx.registry, entry, undefined, resolveThemeOverride(ctx.themes, theme)),
  ];
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
  axes: readonly ThemeAxis[],
): TokenDiagnostic[] {
  const diagnostics: TokenDiagnostic[] = [];

  function checkEntry(
    entry: TokenEntry,
    verified: Set<string>,
    themeName?: string,
    override?: ThemeOverride,
    onError?: (key: string, error: unknown) => boolean,
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
        if (onError && !onError(startKey, error)) return;
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
        if (onError && !onError(startKey, error)) return;
        const diagnostic = aliasDiagnostic(error, entry, themeName);
        if (!diagnostic) throw error;
        diagnostics.push(diagnostic);
      }
    }
  }

  const baseVerified = new Set<string>();
  const baseMemberEntries: TokenEntry[] = [];
  for (const entry of registry.values()) {
    checkEntry(entry, baseVerified);
    if (memberAliasesOf(entry).length > 0) {
      baseMemberEntries.push(entry);
    }
  }

  const singleAxis = axes.length === 1;
  const invalidKeys = new Set<string>();

  for (const axis of axes) {
    for (const [contextName, overrides] of Object.entries(axis.contexts)) {
      const label = singleAxis ? contextName : `${axis.name}=${contextName}`;
      const themeVerified = new Set<string>();
      for (const [key] of overrides) {
        const entry = registry.get(key);
        if (!entry) {
          invalidKeys.add(key);
          diagnostics.push({
            path: key.split("."),
            message: `Theme "${label}" overrides unknown token "${key}"; it matches no token in the config.`,
          });
        } else {
          checkEntry(entry, themeVerified, label, overrides, (failedKey) => {
            invalidKeys.add(failedKey);
            return true;
          });
        }
      }
      // Also re-check base composite/strokeStyle entries whose member aliases may now cycle through an override.
      for (const entry of baseMemberEntries) {
        const key = pathKey(entry.path);
        if (overrides.has(key) || invalidKeys.has(key)) continue;
        checkEntry(entry, themeVerified, label, overrides, (failedKey) => {
          invalidKeys.add(failedKey);
          return true;
        });
      }
    }
  }

  // Cross-axis cycle detection across axes that introduce aliases.
  const aliasingAxes = axes.filter((axis) =>
    Object.values(axis.contexts).some((override) =>
      [...override.entries()].some(([key, val]) => {
        if (val.alias !== undefined) return true;
        const entry = registry.get(key);
        return entry !== undefined && memberAliasesOf(themedEntry(entry, override)).length > 0;
      }),
    ),
  );

  if (aliasingAxes.length >= 2 && hasUnionAliasCycle(registry, aliasingAxes, invalidKeys)) {
    const seenCrossErrors = new Set<string>();
    for (const { selection, override } of themeCombinations(aliasingAxes)) {
      if (!override) continue;
      const activeAxes = aliasingAxes.filter((axis) => selection[axis.name] !== axis.default);
      if (activeAxes.length < 2) continue;

      const label = activeAxes.map((axis) => `${axis.name}=${selection[axis.name]}`).join(", ");
      const comboVerified = new Set<string>();
      const onError = (failedKey: string, error: unknown) => {
        const errorId =
          error instanceof CircularAliasError
            ? `cycle:${failedKey}:${error.key}`
            : error instanceof AliasTargetNotFoundError
              ? `missing:${failedKey}:${error.key}`
              : `other:${failedKey}`;
        if (seenCrossErrors.has(errorId)) return false;
        seenCrossErrors.add(errorId);
        return true;
      };
      for (const [key] of override) {
        if (invalidKeys.has(key)) continue;
        const entry = registry.get(key);
        if (!entry) continue;
        checkEntry(entry, comboVerified, label, override, onError);
      }
      for (const entry of baseMemberEntries) {
        const key = pathKey(entry.path);
        if (override.has(key) || invalidKeys.has(key)) continue;
        checkEntry(entry, comboVerified, label, override, onError);
      }
    }
  }

  return diagnostics;
}

/**
 * O(V + E) cycle pre-check over the union of base and theme alias edges.
 * If the union graph is a DAG, no cross-axis combination can form a cycle.
 */
function hasUnionAliasCycle(
  registry: TokenRegistry,
  axes: readonly ThemeAxis[],
  invalidKeys: ReadonlySet<string>,
): boolean {
  const adj = new Map<string, Set<string>>();
  const addEdge = (from: string, to: string) => {
    let edges = adj.get(from);
    if (!edges) {
      edges = new Set();
      adj.set(from, edges);
    }
    edges.add(to);
  };

  for (const [key, entry] of registry) {
    if (invalidKeys.has(key)) continue;
    if (entry.alias) addEdge(key, pathKey(entry.alias));
    for (const m of memberAliasesOf(entry)) addEdge(key, pathKey(m));
  }
  for (const axis of axes) {
    for (const override of Object.values(axis.contexts)) {
      for (const [key, val] of override) {
        if (invalidKeys.has(key)) continue;
        if (val.alias) {
          addEdge(key, pathKey(val.alias));
        } else {
          const entry = registry.get(key);
          if (entry) {
            for (const m of memberAliasesOf(themedEntry(entry, override))) {
              addEdge(key, pathKey(m));
            }
          }
        }
      }
    }
  }

  // 0 = unvisited, 1 = visiting, 2 = done
  const state = new Map<string, number>();
  for (const start of adj.keys()) {
    if (state.get(start) !== undefined) continue;
    const stack: Array<{ node: string; iter: Iterator<string> }> = [
      { node: start, iter: (adj.get(start) ?? []).values() },
    ];
    state.set(start, 1);
    while (stack.length > 0) {
      const top = stack[stack.length - 1]!;
      const next = top.iter.next();
      if (next.done) {
        state.set(top.node, 2);
        stack.pop();
        continue;
      }
      const target = next.value;
      const targetState = state.get(target);
      if (targetState === 1) return true;
      if (targetState === undefined) {
        state.set(target, 1);
        stack.push({ node: target, iter: (adj.get(target) ?? []).values() });
      }
    }
  }
  return false;
}
