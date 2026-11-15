import type {
  ColorValue,
  CubicBezierValue,
  DimensionValue,
  DurationValue,
  FontFamilyValue,
  FontWeightValue,
  NumberValue,
  StrokeStyleValue,
  TokenMember,
  TokenType,
  TokenTypeMap,
} from "../../../token-model/values.js";
import type { CompositeTokenType } from "../../../token-model/composite.js";
import type { TokenEntry } from "../../../token-model/registry.js";
import { compositeMembers, isCompositeType } from "../../../token-model/composite.js";
import { pathKey } from "../../../token-model/guards.js";
import { code } from "../../../markdown.js";
import {
  countComponentBreakingChanges,
  countEntityBreakingChanges,
  type Change,
  type ComponentsDiff,
  type EntitiesDiff,
} from "./components.js";
import { countTokenBreakingChanges, stableStringify, type TokenDiff } from "./tokens.js";

type Diff = {
  tokens: TokenDiff;
  /** Absent when components were not compared. */
  components?: ComponentsDiff;
  /** Why they were not, when that is worth telling. */
  componentsNote?: string;
};

export function countBreakingChanges(diff: Diff): number {
  return (
    countTokenBreakingChanges(diff.tokens) +
    (diff.components ? countComponentBreakingChanges(diff.components) : 0)
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

/** Versions the `--format json` documents of `recontent diff`, independently of the snapshot's. */
const DIFF_SCHEMA_VERSION = "1";

export type DiffFormat = "markdown" | "json";

export const DIFF_FORMATS: readonly DiffFormat[] = ["markdown", "json"];

function formatTokensMarkdown(diff: TokenDiff): string {
  const sections: string[] = [];
  const breakingCount = countTokenBreakingChanges(diff);

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
    for (const name of diff.themes.removedThemes) {
      lines.push(`- **removed theme** ${code(name)}`);
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

  if (diff.metadata.length > 0) {
    const lines = [`## Metadata (${diff.metadata.length})`, ""];
    for (const { from, to } of diff.metadata) {
      const notes: string[] = [];
      if ((from.$deprecated ?? false) !== (to.$deprecated ?? false)) {
        notes.push(
          to.$deprecated
            ? `now deprecated${typeof to.$deprecated === "string" ? `: ${to.$deprecated}` : ""}`
            : "no longer deprecated",
        );
      }
      if (from.$description !== to.$description) notes.push("description changed");
      lines.push(`- ${code(pathStr(to))}: ${notes.join(", ")}`);
    }
    sections.push(lines.join("\n"));
  }

  // Removed themes are listed under Breaking.
  const themeCount = diff.themes.addedThemes.length + Object.keys(diff.themes.changedThemes).length;
  if (themeCount > 0) {
    const lines = ["## Themes", ""];
    for (const name of diff.themes.addedThemes) {
      lines.push(`- ${code(name)}: added`);
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

type Literal = string | number | boolean;

function literals(values: Literal[]): string {
  return values.map((value) => code(JSON.stringify(value))).join(", ");
}

function describeValues(from: Literal[], to: Literal[]): string {
  const removed = from.filter((value) => !to.includes(value));
  const added = to.filter((value) => !from.includes(value));
  const parts: string[] = [];
  if (removed.length > 0)
    parts.push(`removed ${removed.length === 1 ? "value" : "values"} ${literals(removed)}`);
  if (added.length > 0)
    parts.push(`added ${added.length === 1 ? "value" : "values"} ${literals(added)}`);
  return parts.join(", ");
}

function formatTypeParameters(
  params: { name: string; constraint?: string; default?: string }[] = [],
) {
  if (params.length === 0) return "(none)";
  const rendered = params.map(
    ({ name, constraint, default: fallback }) =>
      name + (constraint ? ` extends ${constraint}` : "") + (fallback ? ` = ${fallback}` : ""),
  );
  return code(`<${rendered.join(", ")}>`);
}

// `noun` is what a component's props are called on a type: its members.
function describeChange(change: Change, noun: string): string {
  switch (change.kind) {
    case "prop": {
      const subject = `**${noun}** ${code(change.name)}:`;
      switch (change.change) {
        case "added":
          return `**added ${noun}** ${code(change.name)} (${change.breaking ? "required" : "optional"})`;
        case "removed":
          return `**removed ${noun}** ${code(change.name)}`;
        case "required":
          return `${subject} now required`;
        case "optional":
          return `${subject} now optional`;
        case "type":
          return `${subject} type ${code(String(change.from))} -> ${code(String(change.to))}`;
        case "values":
          return `${subject} ${describeValues(change.from as Literal[], change.to as Literal[])}`;
        case "default":
          return `${subject} default ${change.from === undefined ? "none" : code(String(change.from))} -> ${change.to === undefined ? "none" : code(String(change.to))}`;
        case "deprecated":
          return `${subject} ${change.to ? "now deprecated" : "no longer deprecated"}`;
      }
    }
    case "inherits":
      return `**dropped inherited ${noun}s** from ${code(change.name)}: ${change.props.map(code).join(", ")}`;
    case "typeParameters":
      return `**type parameters** ${formatTypeParameters(change.from)} -> ${formatTypeParameters(change.to)}`;
    case "deprecated":
      return change.to ? "**deprecated**" : "**no longer deprecated**";
    case "kind":
      return `**kind** ${change.from} -> ${change.to}`;
    case "values":
      return `**values** ${describeValues(change.from, change.to)}`;
    case "definition":
      return `**definition** ${code(change.from)} -> ${code(change.to)}`;
  }
}

function formatEntitiesMarkdown<T>(
  diff: EntitiesDiff<T>,
  options: { label: (entity: T) => string; noun: string; describe?: (entity: T) => string },
): string {
  const { label, noun, describe } = options;
  const sections: string[] = [];
  // One bullet per component, its changes nested under it. The section's count is of the changes.
  const changeGroups = (breaking: boolean) => {
    const lines: string[] = [];
    let count = 0;
    for (const { name, changes } of diff.changed) {
      const matching = changes.filter((change) => change.breaking === breaking);
      if (matching.length === 0) continue;
      count += matching.length;
      lines.push(`- ${code(name)}`, ...matching.map((c) => `  - ${describeChange(c, noun)}`));
    }
    return { lines, count };
  };

  const breaking = changeGroups(true);
  const removed = diff.removed.map((entity) => `- ${code(label(entity))}: **removed**`);
  if (removed.length + breaking.count > 0) {
    const count = removed.length + breaking.count;
    sections.push([`## Breaking (${count})`, "", ...removed, ...breaking.lines].join("\n"));
  }

  if (diff.added.length > 0) {
    const lines = diff.added.map(
      (entity) => `- ${code(label(entity))}${describe ? ` (${describe(entity)})` : ""}`,
    );
    sections.push([`## Added (${lines.length})`, "", ...lines].join("\n"));
  }

  const changed = changeGroups(false);
  if (changed.count > 0) {
    sections.push([`## Changed (${changed.count})`, "", ...changed.lines].join("\n"));
  }
  return sections.join("\n\n");
}

function formatDiffMarkdown(diff: Diff, rev: string): string {
  const sections: string[] = [];
  const tokens = formatTokensMarkdown(diff.tokens);
  if (tokens) sections.push(`# Tokens\n\n${tokens}`);

  if (diff.components) {
    const components = formatEntitiesMarkdown(diff.components.components, {
      label: (component) => component.name,
      noun: "prop",
    });
    if (components) sections.push(`# Components\n\n${components}`);
    const types = formatEntitiesMarkdown(diff.components.types, {
      label: (type) => type.id,
      noun: "member",
      describe: (type) => type.kind,
    });
    if (types) sections.push(`# Types\n\n${types}`);
  }

  if (sections.length === 0) {
    sections.push(`No changes between the working tree and ${rev}.`);
  }
  if (diff.componentsNote) sections.push(diff.componentsNote);
  return sections.join("\n\n");
}

export type DiffContext = {
  /** Config path, relative to the git root. */
  config: string;
  /** The revision the config was compared against. */
  rev: string;
};

function entityCounts(diff: EntitiesDiff<unknown>) {
  return {
    added: diff.added.length,
    removed: diff.removed.length,
    changed: diff.changed.length,
    breaking: countEntityBreakingChanges(diff),
  };
}

// The comparison context lives inside the object (rather than in a separate
// line) so stdout is a single self-contained JSON document.
function formatDiffJson(diff: Diff, context: DiffContext): string {
  const breaking = countBreakingChanges(diff);
  const { tokens, components } = diff;
  return JSON.stringify(
    {
      schemaVersion: DIFF_SCHEMA_VERSION,
      kind: "diff",
      ...context,
      breaking: breaking > 0,
      counts: {
        tokens: {
          added: tokens.added.length,
          removed: tokens.removed.length,
          renamed: tokens.renamed.length,
          retyped: tokens.retyped.length,
          changed: tokens.changed.length,
          metadata: tokens.metadata.length,
          breaking: countTokenBreakingChanges(tokens),
        },
        ...(components && {
          components: entityCounts(components.components),
          types: entityCounts(components.types),
        }),
        breaking,
      },
      tokens,
      ...components,
      componentsNote: diff.componentsNote,
    },
    null,
    2,
  );
}

export function formatDiff(
  diff: Diff,
  format: DiffFormat = "markdown",
  context: DiffContext = { config: "", rev: "HEAD" },
): string {
  return format === "json" ? formatDiffJson(diff, context) : formatDiffMarkdown(diff, context.rev);
}

/** What `--format json` prints on stdout when the diff could not be computed. */
export function formatDiffError(message: string): string {
  return JSON.stringify(
    { schemaVersion: DIFF_SCHEMA_VERSION, kind: "error", errors: [{ message }] },
    null,
    2,
  );
}
