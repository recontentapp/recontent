import type { Config } from "../../../config/types.js";
import type {
  ThemeAxis,
  ThemeOverride,
  ThemeValue,
  TokenEntry,
  TokenRegistry,
} from "../../../token-model/registry.js";
import type { TokenType } from "../../../token-model/values.js";
import { pathKey } from "../../../token-model/guards.js";

/** `type` is the overridden token's, when it is still in the config. */
type ThemeOverrideDiff = {
  added: { key: string; type?: TokenType; value: ThemeValue }[];
  removed: { key: string; type?: TokenType; value: ThemeValue }[];
  changed: { key: string; type?: TokenType; from: ThemeValue; to: ThemeValue }[];
};

type AxisContextDiff = {
  defaultChanged?: { from: string; to: string };
  addedContexts: string[];
  removedContexts: string[];
  changedContexts: Record<string, ThemeOverrideDiff>;
};

type ThemeDiff = {
  addedAxes: string[];
  removedAxes: string[];
  changedAxes: Record<string, AxisContextDiff>;
  orderChanged?: { from: string[]; to: string[] };
};

export type ThemeDiffMeta = {
  implicitSingle: boolean;
  addedAxisContexts: Record<string, string[]>;
};

const themeDiffMetaMap = new WeakMap<ThemeDiff, ThemeDiffMeta>();

export function themeDiffMeta(diff: ThemeDiff): ThemeDiffMeta | undefined {
  return themeDiffMetaMap.get(diff);
}

export type TokenDiff = {
  added: TokenEntry[];
  removed: TokenEntry[];
  renamed: { from: TokenEntry; to: TokenEntry }[];
  retyped: { from: TokenEntry; to: TokenEntry }[];
  changed: { from: TokenEntry; to: TokenEntry }[];
  /** Deprecation or description changed, whether or not the value did. Never breaking. */
  metadata: { from: TokenEntry; to: TokenEntry }[];
  themes: ThemeDiff;
};

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    const entries = keys.map(
      (key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`,
    );
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

function fingerprintValue(entry: TokenEntry): string {
  return entry.alias ? `alias:${pathKey(entry.alias)}` : stableStringify(entry.$value);
}

function renameFingerprint(entry: TokenEntry): string {
  // A token that moves to another layer is a removal and an addition, not a rename.
  return `${entry.layer}|${entry.$type}|${fingerprintValue(entry)}`;
}

function findRenames(
  added: TokenEntry[],
  removed: TokenEntry[],
): {
  renamed: { from: TokenEntry; to: TokenEntry }[];
  added: TokenEntry[];
  removed: TokenEntry[];
} {
  const removedByFingerprint = new Map<string, TokenEntry[]>();
  for (const entry of removed) {
    const fp = renameFingerprint(entry);
    const list = removedByFingerprint.get(fp);
    if (list) list.push(entry);
    else removedByFingerprint.set(fp, [entry]);
  }

  const addedByFingerprint = new Map<string, TokenEntry[]>();
  for (const entry of added) {
    const fp = renameFingerprint(entry);
    const list = addedByFingerprint.get(fp);
    if (list) list.push(entry);
    else addedByFingerprint.set(fp, [entry]);
  }

  const renamed: { from: TokenEntry; to: TokenEntry }[] = [];
  const renamedFromKeys = new Set<string>();
  const renamedToKeys = new Set<string>();

  for (const [fp, removedGroup] of removedByFingerprint) {
    const addedGroup = addedByFingerprint.get(fp);
    if (!addedGroup || removedGroup.length !== 1 || addedGroup.length !== 1) continue;
    const from = removedGroup[0]!;
    const to = addedGroup[0]!;
    renamed.push({ from, to });
    renamedFromKeys.add(pathKey(from.path));
    renamedToKeys.add(pathKey(to.path));
  }

  return {
    renamed,
    added: added.filter((entry) => !renamedToKeys.has(pathKey(entry.path))),
    removed: removed.filter((entry) => !renamedFromKeys.has(pathKey(entry.path))),
  };
}

function fingerprintThemeValue(value: ThemeValue, renamedKeys?: Map<string, string>): string {
  if (value.alias) {
    const target = pathKey(value.alias);
    return `alias:${renamedKeys?.get(target) ?? target}`;
  }
  return stableStringify(value.$value);
}

function diffThemeOverride(
  base: ThemeOverride,
  head: ThemeOverride,
  registries: { base: TokenRegistry; head: TokenRegistry },
  renamedKeys: Map<string, string>,
): ThemeOverrideDiff {
  const added: ThemeOverrideDiff["added"] = [];
  const removed: ThemeOverrideDiff["removed"] = [];
  const changed: ThemeOverrideDiff["changed"] = [];
  const typeOf = (key: string, registry: TokenRegistry) => {
    const type = registry.get(key)?.$type;
    return type ? { type } : {};
  };

  for (const [key, value] of head) {
    if (!base.has(key)) added.push({ key, ...typeOf(key, registries.head), value });
  }
  for (const [key, value] of base) {
    if (!head.has(key)) removed.push({ key, ...typeOf(key, registries.base), value });
  }
  for (const [key, from] of base) {
    const to = head.get(key);
    if (to && fingerprintThemeValue(from, renamedKeys) !== fingerprintThemeValue(to)) {
      changed.push({ key, ...typeOf(key, registries.head), from, to });
    }
  }

  return { added, removed, changed };
}

function diffThemes(
  base: readonly ThemeAxis[],
  head: readonly ThemeAxis[],
  registries: { base: TokenRegistry; head: TokenRegistry },
  renamedKeys: Map<string, string>,
): ThemeDiff {
  const baseByName = new Map(base.map((axis) => [axis.name, axis]));
  const headByName = new Map(head.map((axis) => [axis.name, axis]));

  const addedAxes = head.filter((axis) => !baseByName.has(axis.name)).map((axis) => axis.name);
  const removedAxes = base.filter((axis) => !headByName.has(axis.name)).map((axis) => axis.name);
  const changedAxes: Record<string, AxisContextDiff> = {};

  for (const baseAxis of base) {
    const headAxis = headByName.get(baseAxis.name);
    if (!headAxis) continue;

    const baseCtxNames = new Set(Object.keys(baseAxis.contexts));
    const headCtxNames = new Set(Object.keys(headAxis.contexts));

    const addedContexts = [...headCtxNames].filter((name) => !baseCtxNames.has(name));
    const removedContexts = [...baseCtxNames].filter((name) => !headCtxNames.has(name));
    const changedContexts: Record<string, ThemeOverrideDiff> = {};

    for (const name of baseCtxNames) {
      if (!headCtxNames.has(name)) continue;
      const ctxDiff = diffThemeOverride(
        baseAxis.contexts[name]!,
        headAxis.contexts[name]!,
        registries,
        renamedKeys,
      );
      if (ctxDiff.added.length > 0 || ctxDiff.removed.length > 0 || ctxDiff.changed.length > 0) {
        changedContexts[name] = ctxDiff;
      }
    }

    const defaultChanged =
      baseAxis.default !== headAxis.default
        ? { from: baseAxis.default, to: headAxis.default }
        : undefined;

    if (
      defaultChanged !== undefined ||
      addedContexts.length > 0 ||
      removedContexts.length > 0 ||
      Object.keys(changedContexts).length > 0
    ) {
      changedAxes[baseAxis.name] = {
        ...(defaultChanged ? { defaultChanged } : {}),
        addedContexts,
        removedContexts,
        changedContexts,
      };
    }
  }

  const sharedBaseOrder = base.map((axis) => axis.name).filter((name) => headByName.has(name));
  const sharedHeadOrder = head.map((axis) => axis.name).filter((name) => baseByName.has(name));
  const orderChanged =
    sharedBaseOrder.join("\0") !== sharedHeadOrder.join("\0")
      ? { from: sharedBaseOrder, to: sharedHeadOrder }
      : undefined;

  const result: ThemeDiff = {
    addedAxes,
    removedAxes,
    changedAxes,
    ...(orderChanged ? { orderChanged } : {}),
  };

  const isImplicitConfig = (axes: readonly ThemeAxis[]) =>
    axes.length === 0 ||
    (axes.length === 1 && axes[0]!.name === "theme" && axes[0]!.default === "default");
  const addedAxisContexts = Object.fromEntries(
    addedAxes.map((axisName) => [axisName, Object.keys(headByName.get(axisName)!.contexts)]),
  );
  themeDiffMetaMap.set(result, {
    implicitSingle: isImplicitConfig(base) && isImplicitConfig(head),
    addedAxisContexts,
  });

  return result;
}

// An override of a renamed token follows the rename, and an override of a removed token goes with
// it, so neither is also reported as a removed override.
function followTokenChanges(
  themes: readonly ThemeAxis[],
  renamedKeys: Map<string, string>,
  removedKeys: Set<string>,
): ThemeAxis[] {
  return themes.map((axis) => ({
    ...axis,
    contexts: Object.fromEntries(
      Object.entries(axis.contexts).map(([name, overrides]) => [
        name,
        new Map(
          [...overrides]
            .filter(([key]) => !removedKeys.has(key))
            .map(([key, value]) => [renamedKeys.get(key) ?? key, value]),
        ),
      ]),
    ),
  }));
}

export function diffConfigs(base: Config, head: Config): TokenDiff {
  const baseKeys = new Set(base.registry.keys());
  const headKeys = new Set(head.registry.keys());

  const addedCandidates: TokenEntry[] = [];
  const removedCandidates: TokenEntry[] = [];
  const retyped: { from: TokenEntry; to: TokenEntry }[] = [];
  const changed: { from: TokenEntry; to: TokenEntry }[] = [];
  const metadata: { from: TokenEntry; to: TokenEntry }[] = [];

  for (const key of headKeys) {
    if (!baseKeys.has(key)) addedCandidates.push(head.registry.get(key)!);
  }
  for (const key of baseKeys) {
    if (!headKeys.has(key)) removedCandidates.push(base.registry.get(key)!);
  }

  const { renamed, added, removed } = findRenames(addedCandidates, removedCandidates);
  const renamedKeys = new Map(
    renamed.map(({ from, to }) => [pathKey(from.path), pathKey(to.path)]),
  );

  // An alias that merely follows its target's rename is reported once, as the rename.
  const fingerprintFollowingRenames = (entry: TokenEntry): string => {
    if (!entry.alias) return fingerprintValue(entry);
    const target = pathKey(entry.alias);
    return `alias:${renamedKeys.get(target) ?? target}`;
  };

  for (const key of baseKeys) {
    if (!headKeys.has(key)) continue;
    const from = base.registry.get(key)!;
    const to = head.registry.get(key)!;
    if (from.$type !== to.$type) {
      retyped.push({ from, to });
      continue;
    }
    if (
      (from.$deprecated ?? false) !== (to.$deprecated ?? false) ||
      from.$description !== to.$description
    ) {
      metadata.push({ from, to });
    }
    if (fingerprintFollowingRenames(from) !== fingerprintValue(to)) {
      changed.push({ from, to });
    }
  }

  return {
    added,
    removed,
    renamed,
    retyped,
    changed,
    metadata,
    themes: diffThemes(
      followTokenChanges(base.themes, renamedKeys, new Set(removed.map((e) => pathKey(e.path)))),
      head.themes,
      { base: base.registry, head: head.registry },
      renamedKeys,
    ),
  };
}

/** Removing a token, a theme axis, or a theme context breaks consumers that reference it. */
export function countTokenBreakingChanges(diff: TokenDiff): number {
  const removedContextsCount = Object.values(diff.themes.changedAxes).reduce(
    (sum, axis) => sum + axis.removedContexts.length,
    0,
  );
  return (
    diff.removed.length +
    diff.renamed.length +
    diff.retyped.length +
    diff.themes.removedAxes.length +
    removedContextsCount
  );
}

export function hasBreakingChanges(diff: TokenDiff): boolean {
  return countTokenBreakingChanges(diff) > 0;
}
