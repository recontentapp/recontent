import type { Config } from "../../../config/types.js";
import type {
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

type ThemeDiff = {
  addedThemes: string[];
  removedThemes: string[];
  changedThemes: Record<string, ThemeOverrideDiff>;
};

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

function diffThemeOverride(
  base: ThemeOverride,
  head: ThemeOverride,
  registries: { base: TokenRegistry; head: TokenRegistry },
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
    if (to && stableStringify(from) !== stableStringify(to)) {
      changed.push({ key, ...typeOf(key, registries.head), from, to });
    }
  }

  return { added, removed, changed };
}

function diffThemes(
  base: Record<string, ThemeOverride>,
  head: Record<string, ThemeOverride>,
  registries: { base: TokenRegistry; head: TokenRegistry },
): ThemeDiff {
  const baseNames = new Set(Object.keys(base));
  const headNames = new Set(Object.keys(head));

  const addedThemes = [...headNames].filter((name) => !baseNames.has(name));
  const removedThemes = [...baseNames].filter((name) => !headNames.has(name));
  const changedThemes: Record<string, ThemeOverrideDiff> = {};

  for (const name of baseNames) {
    if (!headNames.has(name)) continue;
    const themeDiff = diffThemeOverride(base[name]!, head[name]!, registries);
    if (
      themeDiff.added.length > 0 ||
      themeDiff.removed.length > 0 ||
      themeDiff.changed.length > 0
    ) {
      changedThemes[name] = themeDiff;
    }
  }

  return { addedThemes, removedThemes, changedThemes };
}

// An override of a renamed token follows the rename, and an override of a removed token goes with
// it, so neither is also reported as a removed override.
function followTokenChanges(
  themes: Record<string, ThemeOverride>,
  renamedKeys: Map<string, string>,
  removedKeys: Set<string>,
): Record<string, ThemeOverride> {
  return Object.fromEntries(
    Object.entries(themes).map(([name, overrides]) => [
      name,
      new Map(
        [...overrides]
          .filter(([key]) => !removedKeys.has(key))
          .map(([key, value]) => [renamedKeys.get(key) ?? key, value]),
      ),
    ]),
  );
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
    ),
  };
}

/** Removing a token or a theme breaks consumers that reference it. A dropped override only falls back to the base value. */
export function countTokenBreakingChanges(diff: TokenDiff): number {
  return (
    diff.removed.length +
    diff.renamed.length +
    diff.retyped.length +
    diff.themes.removedThemes.length
  );
}

export function hasBreakingChanges(diff: TokenDiff): boolean {
  return countTokenBreakingChanges(diff) > 0;
}
