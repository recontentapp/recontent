import type {
  ColorValue,
  CompositeTokenType,
  Config,
  CubicBezierValue,
  DimensionValue,
  DurationValue,
  FontFamilyValue,
  FontWeightValue,
  NumberValue,
  StrokeStyleValue,
  ThemeOverride,
  TokenEntry,
  TokenMember,
  TokenType,
  TokenTypeMap,
} from "@recontentapp/core";
import { compositeMembers, isCompositeType, pathKey } from "@recontentapp/core";

type ThemeOverrideDiff = {
  added: { key: string; value: unknown }[];
  removed: { key: string; value: unknown }[];
  changed: { key: string; from: unknown; to: unknown }[];
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
  themes: ThemeDiff;
};

function stableStringify(value: unknown): string {
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
  return `${entry.$type}|${fingerprintValue(entry)}`;
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

function diffThemeOverride(base: ThemeOverride, head: ThemeOverride): ThemeOverrideDiff {
  const added: { key: string; value: unknown }[] = [];
  const removed: { key: string; value: unknown }[] = [];
  const changed: { key: string; from: unknown; to: unknown }[] = [];

  for (const [key, value] of head) {
    if (!base.has(key)) added.push({ key, value });
  }
  for (const [key, value] of base) {
    if (!head.has(key)) removed.push({ key, value });
  }
  for (const [key, fromValue] of base) {
    if (!head.has(key)) continue;
    const toValue = head.get(key);
    if (stableStringify(fromValue) !== stableStringify(toValue)) {
      changed.push({ key, from: fromValue, to: toValue });
    }
  }

  return { added, removed, changed };
}

function diffThemes(
  base: Record<string, ThemeOverride>,
  head: Record<string, ThemeOverride>,
): ThemeDiff {
  const baseNames = new Set(Object.keys(base));
  const headNames = new Set(Object.keys(head));

  const addedThemes = [...headNames].filter((name) => !baseNames.has(name));
  const removedThemes = [...baseNames].filter((name) => !headNames.has(name));
  const changedThemes: Record<string, ThemeOverrideDiff> = {};

  for (const name of baseNames) {
    if (!headNames.has(name)) continue;
    const themeDiff = diffThemeOverride(base[name]!, head[name]!);
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

export function diffConfigs(base: Config, head: Config): TokenDiff {
  const baseKeys = new Set(base.registry.keys());
  const headKeys = new Set(head.registry.keys());

  const addedCandidates: TokenEntry[] = [];
  const removedCandidates: TokenEntry[] = [];
  const retyped: { from: TokenEntry; to: TokenEntry }[] = [];
  const changed: { from: TokenEntry; to: TokenEntry }[] = [];

  for (const key of headKeys) {
    if (!baseKeys.has(key)) addedCandidates.push(head.registry.get(key)!);
  }
  for (const key of baseKeys) {
    if (!headKeys.has(key)) removedCandidates.push(base.registry.get(key)!);
  }
  for (const key of baseKeys) {
    if (!headKeys.has(key)) continue;
    const from = base.registry.get(key)!;
    const to = head.registry.get(key)!;
    if (from.$type !== to.$type) {
      retyped.push({ from, to });
      continue;
    }
    if (fingerprintValue(from) !== fingerprintValue(to)) {
      changed.push({ from, to });
    }
  }

  const { renamed, added, removed } = findRenames(addedCandidates, removedCandidates);

  return {
    added,
    removed,
    renamed,
    retyped,
    changed,
    themes: diffThemes(base.themes, head.themes),
  };
}

export function hasBreakingChanges(diff: TokenDiff): boolean {
  return diff.removed.length > 0 || diff.renamed.length > 0 || diff.retyped.length > 0;
}

function isDiffEmpty(diff: TokenDiff): boolean {
  return (
    diff.added.length === 0 &&
    diff.removed.length === 0 &&
    diff.renamed.length === 0 &&
    diff.retyped.length === 0 &&
    diff.changed.length === 0 &&
    diff.themes.addedThemes.length === 0 &&
    diff.themes.removedThemes.length === 0 &&
    Object.keys(diff.themes.changedThemes).length === 0
  );
}

function pathStr(entry: TokenEntry): string {
  return pathKey(entry.path);
}

// Renders a leaf token value the way a human reading a config would write it
// (e.g. "16px", "#0064e0"), instead of the raw internal JSON shape.
function formatPrimitiveValue(type: TokenType, value: unknown): string {
  switch (type) {
    case "color":
      return (value as ColorValue).hex;
    case "dimension": {
      const dimension = value as DimensionValue;
      return `${dimension.value}${dimension.unit}`;
    }
    case "duration": {
      const duration = value as DurationValue;
      return `${duration.value}${duration.unit}`;
    }
    case "number":
      return String((value as NumberValue).value);
    case "fontWeight":
      return String((value as FontWeightValue).value);
    case "fontFamily":
      return (value as FontFamilyValue).value.join(", ");
    case "cubicBezier":
      return `[${(value as CubicBezierValue).value.join(", ")}]`;
    case "strokeStyle": {
      const strokeStyle = value as StrokeStyleValue;
      return "style" in strokeStyle
        ? strokeStyle.style
        : `dashed(${strokeStyle.dashArray.length} segments)`;
    }
    default:
      return stableStringify(value);
  }
}

function shortValue(entry: TokenEntry): string {
  if (entry.alias) return `alias -> ${pathKey(entry.alias)}`;
  return formatPrimitiveValue(entry.$type, entry.$value);
}

function describeEntry(entry: TokenEntry): string {
  if (entry.alias) return `${entry.$type}, alias -> ${pathKey(entry.alias)}`;
  if (isCompositeType(entry.$type)) return entry.$type;
  return `${entry.$type} ${formatPrimitiveValue(entry.$type, entry.$value)}`;
}

function formatMember(type: TokenType, member: TokenMember): string {
  return formatPrimitiveValue(type, member.$value);
}

// Composite tokens (typography, shadow, ...) bake the resolved value of each
// aliased member alongside its alias path, so a value change several hops up
// an alias chain still shows up here even though the alias path is unchanged.
// We diff member-by-member so only the nested field that actually changed is
// reported, instead of dumping the whole composite object.
function diffCompositeMembers(
  type: CompositeTokenType,
  fromValue: unknown,
  toValue: unknown,
): { key: string; from: string; to: string }[] {
  const fromMembers = compositeMembers(type, fromValue as TokenTypeMap[CompositeTokenType]);
  const toMembers = compositeMembers(type, toValue as TokenTypeMap[CompositeTokenType]);
  const fromByKey = new Map(fromMembers.map((member) => [member.key, member]));
  const toByKey = new Map(toMembers.map((member) => [member.key, member]));

  const results: { key: string; from: string; to: string }[] = [];
  for (const key of new Set([...fromByKey.keys(), ...toByKey.keys()])) {
    const fromMember = fromByKey.get(key);
    const toMember = toByKey.get(key);

    if (!fromMember || !toMember) {
      results.push({
        key,
        from: fromMember ? formatMember(fromMember.type, fromMember.member) : "(none)",
        to: toMember ? formatMember(toMember.type, toMember.member) : "(none)",
      });
      continue;
    }

    if (stableStringify(fromMember.member.$value) !== stableStringify(toMember.member.$value)) {
      results.push({
        key,
        from: formatMember(fromMember.type, fromMember.member),
        to: formatMember(toMember.type, toMember.member),
      });
    }
  }
  return results;
}

function formatChangedLine(path: string, from: string, to: string): string[] {
  return [`# ${path}`, `- ${from}`, `+ ${to}`];
}

export type DiffFormat = "markdown" | "json";

export const DIFF_FORMATS: readonly DiffFormat[] = ["markdown", "json"];

function code(text: string): string {
  return `\`${text}\``;
}

function formatDiffMarkdown(diff: TokenDiff): string {
  if (isDiffEmpty(diff)) {
    return "No token changes between the working tree and HEAD.";
  }

  const sections: string[] = [];
  const breakingCount = diff.removed.length + diff.renamed.length + diff.retyped.length;

  if (breakingCount > 0) {
    const lines = [`## Breaking (${breakingCount})`, ""];
    for (const { from, to } of diff.renamed) {
      lines.push(
        `- **renamed** ${code(pathStr(from))} -> ${code(pathStr(to))} (${describeEntry(to)})`,
      );
    }
    for (const { from, to } of diff.retyped) {
      lines.push(`- **retyped** ${code(pathStr(from))}: ${from.$type} -> ${to.$type}`);
    }
    for (const entry of diff.removed) {
      lines.push(`- **removed** ${code(pathStr(entry))} (${describeEntry(entry)})`);
    }
    sections.push(lines.join("\n"));
  }

  if (diff.added.length > 0) {
    const lines = [`## Added (${diff.added.length})`, ""];
    for (const entry of diff.added) {
      lines.push(`- ${code(pathStr(entry))} (${describeEntry(entry)})`);
    }
    sections.push(lines.join("\n"));
  }

  if (diff.changed.length > 0) {
    // A single fenced `diff` block, so GitHub/GitLab colour the -/+ lines.
    const lines = [`## Changed (${diff.changed.length})`, "", "```diff"];
    for (const { from, to } of diff.changed) {
      if (isCompositeType(from.$type)) {
        const memberChanges = diffCompositeMembers(from.$type, from.$value, to.$value);
        if (memberChanges.length > 0) {
          for (const member of memberChanges) {
            lines.push(
              ...formatChangedLine(`${pathStr(from)}.${member.key}`, member.from, member.to),
            );
          }
          continue;
        }
      }
      lines.push(...formatChangedLine(pathStr(from), shortValue(from), shortValue(to)));
    }
    lines.push("```");
    sections.push(lines.join("\n"));
  }

  const themeNames = new Set([
    ...diff.themes.addedThemes,
    ...diff.themes.removedThemes,
    ...Object.keys(diff.themes.changedThemes),
  ]);
  if (themeNames.size > 0) {
    const lines = ["## Themes", ""];
    for (const name of diff.themes.addedThemes) {
      lines.push(`- ${code(name)}: added`);
    }
    for (const name of diff.themes.removedThemes) {
      lines.push(`- ${code(name)}: removed`);
    }
    for (const [name, themeDiff] of Object.entries(diff.themes.changedThemes)) {
      lines.push(
        `- ${code(name)}: +${themeDiff.added.length} override, -${themeDiff.removed.length}, ~${themeDiff.changed.length} changed`,
      );
    }
    sections.push(lines.join("\n"));
  }

  return sections.join("\n\n");
}

export type DiffContext = {
  /** Config path, relative to the git root. */
  config: string;
  /** The revision the config was compared against. */
  rev: string;
};

// The comparison context lives inside the object (rather than in a separate
// line) so stdout is a single self-contained JSON document.
function formatDiffJson(diff: TokenDiff, context: DiffContext): string {
  return JSON.stringify({ ...context, ...diff }, null, 2);
}

export function formatDiff(
  diff: TokenDiff,
  format: DiffFormat = "markdown",
  context: DiffContext = { config: "", rev: "HEAD" },
): string {
  return format === "json" ? formatDiffJson(diff, context) : formatDiffMarkdown(diff);
}
