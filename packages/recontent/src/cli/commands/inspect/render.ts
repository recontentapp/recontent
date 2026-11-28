import type { ComponentInfo, PropInfo, TypeInfo } from "../../../introspection/model.js";
import type { TokenLayer } from "../../../token-model/model.js";
import { plural } from "../../utils/format.js";
import {
  groupByCategory,
  renderComponentMarkdown,
  renderTypeMarkdown,
  type Brevity,
  type ComponentView,
} from "../../../introspection/markdown.js";
import { typeClosure } from "../../../introspection/types.js";
import { code, escapeText } from "../../../markdown.js";
import { SCHEMA_VERSION, type SnapshotThemeAxis } from "../../../snapshot/snapshot.js";
import { resolveDocTokenValue, type DocToken } from "../../../snapshot/doc-token.js";
import { parseThemeSpec, type Hit, type SearchResult } from "./select.js";

export type Format = "markdown" | "json";
export const FORMATS: Format[] = ["markdown", "json"];

const LAYERS: TokenLayer[] = ["ref", "system", "components"];

export type Overview = {
  config: string;
  tokens: DocToken[];
  themes: SnapshotThemeAxis[];
  components?: ComponentInfo[];
  types?: TypeInfo[];
  /** Why `components` is missing although the config asks for them. */
  introspectionError?: string;
};

export type InspectError = { message: string; input?: string; suggestions?: string[] };

/** What `--format json` prints on stdout in place of a result. */
export function renderErrors(errors: InspectError[]): string {
  return JSON.stringify({ schemaVersion: SCHEMA_VERSION, kind: "error", errors }, null, 2);
}

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) counts[key(item)] = (counts[key(item)] ?? 0) + 1;
  return counts;
}

const countList = (counts: Record<string, number>) =>
  Object.entries(counts)
    .map(([name, count]) => `${name} ${count}`)
    .join(", ");

function groupOf(token: DocToken): string {
  return token.path.split(".").slice(0, -1).join(".") || token.layer;
}

type Hint = {
  target: "overview" | "tokens" | "components" | "types" | "search";
  query?: string[];
  props?: string[];
};

const quoted = (argument: string) =>
  /[\s()]/.test(argument) ? JSON.stringify(argument) : argument;

function formatHint({ target, query = [], props }: Hint): string {
  return [
    "recontent inspect",
    ...(target === "overview" ? [] : [target]),
    ...query.map(quoted),
    ...(props ? ["--props", ...props.map(quoted)] : []),
  ].join(" ");
}

/** The `Next:` line for CLI output; omitted when `hints` is false (e.g. MCP). */
function next(enabled: boolean, hints: Hint[]): string | undefined {
  if (!enabled) return undefined;
  if (hints.length === 0) return `Next: ${code("recontent inspect --help")}`;
  return `Next: ${hints.map((hint) => code(formatHint(hint))).join(" · ")}`;
}

const withNext = (lines: string[], enabled: boolean, hints: Hint[]): string[] => {
  const line = next(enabled, hints);
  return line ? [...lines, "", line] : lines;
};

const typeIds = (types: TypeInfo[]) => types.map((type) => code(type.id)).join(", ") || "_None._";

function formatOverviewThemes(themes: readonly SnapshotThemeAxis[]): string {
  if (themes.length === 0) return "none";
  if (
    themes.length === 1 &&
    themes[0]!.name === "theme" &&
    themes[0]!.default === "default" &&
    themes[0]!.description === undefined
  ) {
    return themes[0]!.contexts.map(code).join(", ") || "none";
  }
  return themes
    .map((axis) => `${code(axis.name)} (${[axis.default, ...axis.contexts].map(code).join(", ")})`)
    .join(", ");
}

function defaultThemeColumns(themes: readonly SnapshotThemeAxis[]): string[] {
  if (themes.length === 0) return [];
  if (themes.length === 1) return themes[0]!.contexts;
  return themes.flatMap((axis) => axis.contexts.map((ctx) => `${axis.name}=${ctx}`));
}

export function renderOverview(overview: Overview, format: Format, hints = true): string {
  const { tokens, themes, components, types, introspectionError } = overview;
  const layers = LAYERS.map((layer) => {
    const inLayer = tokens.filter((token) => token.layer === layer);
    return { layer, count: inLayer.length, types: countBy(inLayer, (token) => token.type) };
  });

  if (format === "json") {
    return JSON.stringify(
      {
        schemaVersion: SCHEMA_VERSION,
        kind: "overview",
        config: overview.config,
        tokens: { total: tokens.length, layers },
        themes,
        ...(components
          ? {
              components: components.map((component) => component.name),
              types: (types ?? []).map((type) => type.id),
            }
          : introspectionError !== undefined
            ? { components: { error: introspectionError } }
            : {}),
      },
      null,
      2,
    );
  }

  const lines = [
    "# Overview",
    "",
    `Config: ${code(overview.config)}`,
    `Themes: ${formatOverviewThemes(themes)}`,
  ];
  lines.push("", `## Tokens (${tokens.length})`, "");
  if (tokens.length === 0) {
    lines.push("_No tokens defined._");
  } else {
    lines.push("| Layer | Tokens | Types |", "| --- | --- | --- |");
    for (const { layer, count, types } of layers) {
      lines.push(`| ${layer} | ${count} | ${escapeText(countList(types)) || "—"} |`);
    }
  }
  if (components) {
    lines.push("", `## Components (${components.length})`, "");
    lines.push(components.map((component) => code(component.name)).join(", ") || "_None found._");
    if (types) lines.push("", `## Types (${types.length})`, "", typeIds(types));
  } else if (introspectionError !== undefined) {
    lines.push("", "## Components", "", `_Unavailable: ${escapeText(introspectionError)}_`);
  }

  const targets: Hint[] = [];
  const firstGroup = tokens.find((token) => token.layer === "system") ?? tokens[0];
  if (firstGroup) targets.push({ target: "tokens", query: [groupOf(firstGroup)] });
  if (components?.[0]) targets.push({ target: "components", query: [components[0].name] });
  if (types?.[0]) targets.push({ target: "types" });
  targets.push({ target: "search", query: ["<term>"] });
  return withNext(lines, hints, targets).join("\n");
}

function tokenNotes(token: DocToken): string {
  const parts: string[] = [];
  if (token.alias) parts.push(`→ ${code(token.alias)}`);
  if (token.description) parts.push(escapeText(token.description, "<br>"));
  if (token.deprecated) {
    parts.push(
      token.deprecated === true
        ? "**Deprecated**"
        : `**Deprecated**: ${escapeText(token.deprecated, "<br>")}`,
    );
  }
  return parts.join("<br>");
}

function tokenTable(tokens: DocToken[], themes: string[]): string[] {
  const header = [
    "Token",
    "Type",
    "Value",
    ...themes.map((theme) => escapeText(theme)),
    "CSS variable",
    "Notes",
  ];
  const lines = [`| ${header.join(" | ")} |`, `| ${header.map(() => "---").join(" | ")} |`];
  for (const token of tokens) {
    const row = [
      code(token.path),
      token.type,
      code(token.values.default ?? ""),
      ...themes.map((theme) => (token.values[theme] ? code(token.values[theme]) : "—")),
      code(`var(${token.cssVar})`),
      tokenNotes(token),
    ];
    lines.push(`| ${row.join(" | ")} |`);
  }
  return lines;
}

export function renderTokens(
  tokens: DocToken[],
  options: {
    format: Format;
    themes: readonly SnapshotThemeAxis[];
    summary: boolean;
    theme?: string;
    hints?: boolean;
  },
): string {
  const { format, summary, hints = true } = options;
  const parsedTheme =
    options.theme !== undefined ? parseThemeSpec(options.theme, options.themes).parsed : undefined;
  const columns = parsedTheme
    ? parsedTheme.label === "default"
      ? []
      : [parsedTheme.label]
    : defaultThemeColumns(options.themes);

  const shown = tokens.map((token) => {
    if (!parsedTheme) {
      return token;
    }
    const { value, overridden } = resolveDocTokenValue(
      token,
      options.themes,
      parsedTheme.selection,
    );
    const values: Record<string, string> = { default: token.values.default ?? "" };
    if (parsedTheme.label !== "default" && (format === "json" || overridden)) {
      values[parsedTheme.label] = value;
    }
    return { ...token, values };
  });

  if (format === "json") {
    return JSON.stringify(
      { schemaVersion: SCHEMA_VERSION, kind: "tokens", tokens: shown },
      null,
      2,
    );
  }

  if (summary) {
    const groups = new Map<string, DocToken[]>();
    for (const token of tokens) {
      const group = groupOf(token);
      const inGroup = groups.get(group);
      if (inGroup) inGroup.push(token);
      else groups.set(group, [token]);
    }
    const lines = [
      "# Tokens",
      "",
      `${plural(tokens.length, "token")} in ${plural(groups.size, "group")}.`,
    ];
    if (tokens.length > 0) {
      lines.push("", "| Group | Layer | Tokens | Types |", "| --- | --- | --- | --- |");
      for (const [group, inGroup] of groups) {
        lines.push(
          `| ${code(group)} | ${inGroup[0]!.layer} | ${inGroup.length} | ${escapeText(countList(countBy(inGroup, (token) => token.type)))} |`,
        );
      }
    }
    const first =
      [...groups.keys()].find((group) => group.startsWith("system.")) ?? [...groups.keys()][0];
    return withNext(lines, hints, first ? [{ target: "tokens", query: [first] }] : []).join("\n");
  }

  const lines = ["# Tokens", "", plural(shown.length, "token") + "."];
  if (shown.length > 0) lines.push("", ...tokenTable(shown, columns));
  return lines.join("\n");
}

/** The first sentence, else as many whole words as fit, with an ellipsis when something was cut. */
function shorten(text: string, max = 100): string {
  const flat = text.replace(/\s+/g, " ").trim();
  const sentence = flat.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? flat;
  if (sentence.length <= max) return sentence;
  const cut = sentence.lastIndexOf(" ", max);
  // Counting code points, so that a surrogate pair is never split.
  const head = cut > 0 ? sentence.slice(0, cut) : Array.from(sentence).slice(0, max).join("");
  return `${head.replace(/[,;:\s]+$/, "")}…`;
}

function renderTypesSection(types: TypeInfo[]): string {
  return ["## Types", ...types.map((type) => renderTypeMarkdown(type, 3))].join("\n\n");
}

/** The types that declare props of two or more components: what is worth saying once instead of in every table. */
export function sharedDeclarations(components: ComponentInfo[]): Set<string> {
  const counts = new Map<string, number>();
  for (const component of components) {
    const ids = new Set(component.props.map((prop) => prop.declaredIn));
    for (const id of ids) if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return new Set([...counts].filter(([, count]) => count >= 2).map(([id]) => id));
}

const BREVITY: Brevity = { maxValues: 12, maxTypeLength: 200 };

/** Only the requested props: own ones in full, inherited ones as a row naming where they come from. */
function onlyProps(component: ComponentInfo, names: string[]): PropInfo[] {
  const own = new Map(component.props.map((prop) => [prop.name, prop]));
  const inherited = new Map(
    component.inherits.flatMap((group) =>
      group.props.map((name) => [
        name,
        group.package ? `${group.name} (${group.package})` : group.name,
      ]),
    ),
  );
  return names.flatMap((name): PropInfo[] => {
    const prop = own.get(name);
    const origin = inherited.get(name);
    if (prop) return [prop];
    return origin ? [{ name, type: origin, required: false }] : [];
  });
}

/** The component as `--props` asks for it, in JSON too: the props, what they reference, and who else provides them. */
function narrowed(component: ComponentInfo, names: string[]): ComponentInfo {
  const wanted = new Set(names);
  const props = component.props.filter((prop) => wanted.has(prop.name));
  return {
    ...component,
    props,
    inherits: component.inherits
      .map((group) => ({ ...group, props: group.props.filter((name) => wanted.has(name)) }))
      .filter((group) => group.props.length > 0),
    references: [...new Set(props.flatMap((prop) => prop.references ?? []))].sort((a, b) =>
      a.localeCompare(b),
    ),
  };
}

/** What of a component is printed: by default the props it declares itself and the ones nobody else shares. */
function compactView(
  component: ComponentInfo,
  shared: Set<string>,
  typeFiles: Map<string, string>,
): ComponentView {
  const collapsed = new Map<string, string[]>();
  const props = component.props.filter((prop) => {
    const { declaredIn: id } = prop;
    // The component that owns the declaration still lists it.
    if (!id || !shared.has(id) || typeFiles.get(id) === component.sourceFilePath) return true;
    collapsed.set(id, [...(collapsed.get(id) ?? []), prop.name]);
    return false;
  });
  return {
    props,
    collapsed: [...collapsed]
      .map(([type, names]) => ({ type, props: names }))
      .sort((a, b) => a.type.localeCompare(b.type)),
    brevity: BREVITY,
  };
}

function componentLine(component: ComponentInfo): string {
  const tags = [
    plural(component.props.length, "prop"),
    ...(component.deprecated
      ? [`deprecated${component.replacement ? ` → ${component.replacement}` : ""}`]
      : []),
    ...(component.experimental ? ["experimental"] : []),
  ].join(", ");
  const description = component.description
    ? ` — ${escapeText(shorten(component.description))}`
    : "";
  return `- ${code(component.name)} (${tags})${description}`;
}

export function renderComponents(
  components: ComponentInfo[],
  options: {
    format: Format;
    summary: boolean;
    types: TypeInfo[];
    /** See `sharedDeclarations`, over all components, not only the selected ones. */
    shared?: Set<string>;
    /** Only these props, in full. */
    props?: string[];
    hints?: boolean;
  },
): string {
  const { format, summary, types, shared = new Set(), props: only, hints = true } = options;
  if (format === "json") {
    const shown = only ? components.map((component) => narrowed(component, only)) : components;
    return JSON.stringify(
      {
        schemaVersion: SCHEMA_VERSION,
        kind: "components",
        components: shown,
        types: typeClosure(
          shown.flatMap((component) => [
            ...component.references,
            ...component.props.flatMap((prop) => (prop.declaredIn ? [prop.declaredIn] : [])),
          ]),
          types,
        ),
      },
      null,
      2,
    );
  }

  if (summary) {
    const lines = ["# Components", "", `${plural(components.length, "component")}.`];
    const groups = groupByCategory(components);
    for (const { category, components: inGroup } of groups) {
      lines.push("", ...(category ? [`## ${escapeText(category)}`, ""] : []));
      for (const component of inGroup) lines.push(componentLine(component));
    }
    const first = groups[0]?.components[0];
    // A link may name a type instead.
    const link = first?.links?.find((name) => components.some((other) => other.name === name));
    const nextHints: Hint[] = [];
    if (first) nextHints.push({ target: "components", query: [first.name] });
    if (link) nextHints.push({ target: "components", query: [link] });
    return withNext(lines, hints, nextHints).join("\n");
  }

  if (components.length === 0) return "No components.";
  const typeFiles = new Map(types.map((type) => [type.id, type.sourceFilePath]));
  const views = components.map(
    (component): ComponentView =>
      only
        ? { props: onlyProps(component, only), hideInherits: true }
        : compactView(component, shared, typeFiles),
  );
  const sections = components.map((component, index) =>
    renderComponentMarkdown(component, 2, views[index]),
  );

  // Types the shown props name and that have members are worth their own table; the rest says as much in the props.
  const referenced = [
    ...new Set(
      components.flatMap((component, index) =>
        views[index]!.props!.flatMap((prop) => prop.references ?? []),
      ),
    ),
  ];
  const closure = typeClosure(referenced, types);
  const direct = closure.filter((type) => referenced.includes(type.id) && type.members);
  const more = closure.filter((type) => !direct.includes(type));
  if (direct.length > 0) sections.push(renderTypesSection(direct));
  if (more.length > 0) sections.push(`More types: ${more.map((type) => code(type.id)).join(", ")}`);

  if (!only) {
    const first = components[0]!;
    const collapsed = views.flatMap((view) => view.collapsed ?? []);
    const prop = collapsed[0]?.props[0] ?? views[0]!.props![0]?.name;
    const type = collapsed[0]?.type ?? more[0]?.id ?? direct[0]?.id;
    const nextHints: Hint[] = [];
    if (prop) nextHints.push({ target: "components", query: [first.name], props: [prop] });
    if (type) nextHints.push({ target: "types", query: [type] });
    const line = nextHints.length > 0 ? next(hints, nextHints) : undefined;
    if (line) sections.push(line);
  }
  return sections.join("\n\n");
}

function typeTags(type: TypeInfo): string {
  const size = type.members
    ? plural(type.members.length, "member")
    : type.values
      ? plural(type.values.length, "value")
      : undefined;
  return [
    type.kind,
    ...(size ? [size] : []),
    ...(type.deprecated ? ["deprecated"] : []),
    ...(type.experimental ? ["experimental"] : []),
  ].join(", ");
}

function typeLine(type: TypeInfo): string {
  const description = type.description ? ` — ${escapeText(shorten(type.description))}` : "";
  return `- ${code(type.id)} (${typeTags(type)})${description}`;
}

/** `selected` is what was asked for; `types` adds what it references, so that the detail stands on its own. */
export function renderTypes(
  selected: TypeInfo[],
  options: { format: Format; summary: boolean; types: TypeInfo[]; hints?: boolean },
): string {
  const { format, summary, types, hints = true } = options;
  if (format === "json") {
    return JSON.stringify({ schemaVersion: SCHEMA_VERSION, kind: "types", types }, null, 2);
  }

  if (summary) {
    const lines = ["# Types", "", `${plural(selected.length, "type")}.`, ""];
    for (const type of selected) {
      lines.push(typeLine(type));
    }
    return withNext(
      lines,
      hints,
      selected[0] ? [{ target: "types", query: [selected[0].name] }] : [],
    ).join("\n");
  }

  if (types.length === 0) return "No types.";
  return renderTypesSection(types);
}

export function renderSearch(
  result: SearchResult,
  options: {
    format: Format;
    queries: string[];
    themes: readonly SnapshotThemeAxis[];
    hints?: boolean;
  },
): string {
  const { format, queries, themes, hints = true } = options;
  const columns = defaultThemeColumns(themes);
  const { tokens, components, types, suggestions } = result;
  const total = tokens.length + components.length + types.length;

  if (format === "json") {
    const flat = <T>(hits: Hit<T>[]) => hits.map(({ item, matchedIn }) => ({ ...item, matchedIn }));
    return JSON.stringify(
      {
        schemaVersion: SCHEMA_VERSION,
        kind: "search",
        queries,
        tokens: flat(tokens),
        components: flat(components),
        types: flat(types),
        ...(total === 0 ? { suggestions } : {}),
      },
      null,
      2,
    );
  }

  const lines = ["# Search: " + queries.map(code).join(", "), ""];
  if (total === 0) {
    const hint = suggestions.length > 0 ? ` Did you mean ${suggestions.map(code).join(", ")}?` : "";
    return withNext([...lines, `No matches.${hint}`], hints, [{ target: "overview" }]).join("\n");
  }

  lines.push(`${plural(total, "match", "matches")}.`);
  const matched = (hit: Hit<unknown>, nameLabel: string) =>
    hit.matchedIn.includes(nameLabel) ? "" : ` · matched in ${hit.matchedIn.join(", ")}`;
  if (tokens.length > 0) {
    lines.push(
      "",
      `## Tokens (${tokens.length})`,
      "",
      ...tokenTable(
        tokens.map((hit) => hit.item),
        columns,
      ),
    );
  }
  if (components.length > 0) {
    lines.push("", `## Components (${components.length})`, "");
    for (const hit of components) lines.push(componentLine(hit.item) + matched(hit, "name"));
  }
  if (types.length > 0) {
    lines.push("", `## Types (${types.length})`, "");
    for (const hit of types) lines.push(typeLine(hit.item) + matched(hit, "id"));
  }
  const first = components[0]?.item.name;
  const firstType = types[0]?.item.name;
  return withNext(lines, hints, [
    first
      ? { target: "components", query: [first] }
      : firstType
        ? { target: "types", query: [firstType] }
        : { target: "overview" },
  ]).join("\n");
}
