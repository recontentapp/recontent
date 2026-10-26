import type { ComponentInfo, TokenLayer } from "@recontentapp/core";
import { plural } from "../../utils/format.js";
import { renderComponentMarkdown } from "../../../introspection/markdown.js";
import { code, escapeText } from "../../../markdown.js";
import type { DocToken } from "../../../plugins/shared/doc-token.js";

export type Format = "markdown" | "json";
export const FORMATS: Format[] = ["markdown", "json"];

const SCHEMA_VERSION = "1";
const LAYERS: TokenLayer[] = ["ref", "system", "components"];

export type Overview = {
  config: string;
  tokens: DocToken[];
  themes: string[];
  components?: ComponentInfo[];
  /** Why `components` is missing although the config asks for them. */
  componentsError?: string;
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

const next = (...commands: string[]) =>
  `Next: ${commands.map((command) => code(`recontent inspect ${command}`)).join(" · ")}`;

export function renderOverview(overview: Overview, format: Format): string {
  const { tokens, themes, components, componentsError } = overview;
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
          ? { components: components.map((component) => component.name) }
          : componentsError !== undefined
            ? { components: { error: componentsError } }
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
    `Themes: ${themes.length > 0 ? themes.map(code).join(", ") : "none"}`,
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
  } else if (componentsError !== undefined) {
    lines.push("", "## Components", "", `_Unavailable: ${escapeText(componentsError)}_`);
  }

  const hints: string[] = [];
  const firstGroup = tokens.find((token) => token.layer === "system") ?? tokens[0];
  if (firstGroup) hints.push(`tokens ${groupOf(firstGroup)}`);
  if (components?.[0]) hints.push(`components ${components[0].name}`);
  lines.push("", hints.length > 0 ? next(...hints) : next("--help"));
  return lines.join("\n");
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

export function renderTokens(
  tokens: DocToken[],
  options: { format: Format; themes: string[]; summary: boolean; theme?: string },
): string {
  const { format, summary } = options;
  const themes = options.theme ? [options.theme] : options.themes;
  const shown = tokens.map((token) => ({
    ...token,
    values: Object.fromEntries(
      Object.entries(token.values).filter(([name]) => name === "default" || themes.includes(name)),
    ),
  }));

  if (format === "json") {
    // A theme that does not override a token reads as its default, so a requested theme is always there.
    const requested = options.theme;
    const complete = shown.map((token) =>
      requested && token.values[requested] === undefined && token.values.default !== undefined
        ? { ...token, values: { ...token.values, [requested]: token.values.default } }
        : token,
    );
    return JSON.stringify(
      { schemaVersion: SCHEMA_VERSION, kind: "tokens", tokens: complete },
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
    lines.push("", next(first ? `tokens ${first}` : "--help"));
    return lines.join("\n");
  }

  const lines = ["# Tokens", "", plural(shown.length, "token") + "."];
  if (shown.length > 0) {
    const header = [
      "Token",
      "Type",
      "Value",
      ...themes.map((theme) => escapeText(theme)),
      "CSS variable",
      "Notes",
    ];
    lines.push("", `| ${header.join(" | ")} |`, `| ${header.map(() => "---").join(" | ")} |`);
    for (const token of shown) {
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
  }
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

export function renderComponents(
  components: ComponentInfo[],
  options: { format: Format; summary: boolean },
): string {
  const { format, summary } = options;
  if (format === "json") {
    return JSON.stringify(
      { schemaVersion: SCHEMA_VERSION, kind: "components", components },
      null,
      2,
    );
  }

  if (summary) {
    const lines = ["# Components", "", `${plural(components.length, "component")}.`, ""];
    for (const component of components) {
      const tags = [
        plural(component.props.length, "prop"),
        ...(component.deprecated ? ["deprecated"] : []),
      ].join(", ");
      const description = component.description
        ? ` — ${escapeText(shorten(component.description))}`
        : "";
      lines.push(`- ${code(component.name)} (${tags})${description}`);
    }
    lines.push("", next(components[0] ? `components ${components[0].name}` : "--help"));
    return lines.join("\n");
  }

  if (components.length === 0) return "No components.";
  return components.map((component) => renderComponentMarkdown(component, 2)).join("\n\n");
}
