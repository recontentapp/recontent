import type { DocGroup, DocToken, DocsModel } from "./model.js";

const LAYER_TITLES = { ref: "Reference", system: "System", components: "Components" } as const;

function cell(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
}

function code(text: string): string {
  return `\`${cell(text).replace(/`/g, "'")}\``;
}

function notes(token: DocToken): string {
  const parts: string[] = [];
  if (token.alias) parts.push(`→ ${code(token.alias)}`);
  if (token.description) parts.push(cell(token.description));
  if (token.deprecated) {
    parts.push(
      token.deprecated === true ? "**Deprecated**" : `**Deprecated**: ${cell(token.deprecated)}`,
    );
  }
  return parts.join("<br>");
}

function renderGroup(group: DocGroup, themes: string[]): string {
  const lines = [`### ${group.label}`, ""];
  if (group.scale?.description) lines.push(group.scale.description, "");
  if (group.scale?.deprecated) {
    lines.push(
      group.scale.deprecated === true
        ? "> ⚠️ Deprecated"
        : `> ⚠️ Deprecated: ${group.scale.deprecated}`,
      "",
    );
  }

  const header = ["Token", "Type", "Value", ...themes, "Notes"];
  lines.push(`| ${header.join(" | ")} |`, `| ${header.map(() => "---").join(" | ")} |`);
  for (const token of group.tokens) {
    const row = [
      code(token.path),
      token.type,
      code(token.values.default ?? ""),
      ...themes.map((theme) => (token.values[theme] ? code(token.values[theme]) : "—")),
      notes(token),
    ];
    lines.push(`| ${row.join(" | ")} |`);
  }
  return lines.join("\n");
}

export function renderMarkdown(model: DocsModel): string {
  const themeSummary =
    model.themes.length > 0
      ? `${model.themes.length} theme${model.themes.length === 1 ? "" : "s"} (${model.themes.join(", ")})`
      : "no themes";
  const sections = [
    `# ${model.title}`,
    `${model.tokenCount} token${model.tokenCount === 1 ? "" : "s"} · ${themeSummary}`,
  ];

  for (const { layer, groups } of model.layers) {
    sections.push(`## ${LAYER_TITLES[layer]}`);
    if (groups.length === 0) {
      sections.push("_No tokens defined._");
      continue;
    }
    for (const group of groups) sections.push(renderGroup(group, model.themes));
  }

  return `${sections.join("\n\n")}\n`;
}
