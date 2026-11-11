import type { OutputFile, PluginContext, RecontentPlugin } from "@recontentapp/core";
import { renderComponentMarkdown } from "../introspection/markdown.js";
import { code, escapeText } from "../markdown.js";
import { outputPlugin } from "./factory.js";
import type { DocToken } from "./shared/doc-token.js";
import { buildDocsModel, type DocGroup, type DocsModel } from "./shared/docs-model.js";

export type DesignMdPluginOptions = {
  outDir: string;
  /** Document title. Defaults to "Design system". */
  title?: string;
};

const LAYER_TITLES = { ref: "Reference", system: "System", components: "Components" } as const;

function notes(token: DocToken): string {
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

function renderGroup(group: DocGroup, themes: string[]): string {
  const lines = [`### ${escapeText(group.label)}`, ""];
  if (group.scale?.description) lines.push(escapeText(group.scale.description), "");
  if (group.scale?.deprecated) {
    lines.push(
      group.scale.deprecated === true
        ? "> ⚠️ Deprecated"
        : `> ⚠️ Deprecated: ${escapeText(group.scale.deprecated)}`,
      "",
    );
  }

  const header = ["Token", "Type", "Value", ...themes.map((theme) => escapeText(theme)), "Notes"];
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

function renderMarkdown(model: DocsModel): string {
  const themeSummary =
    model.themes.length > 0
      ? `${model.themes.length} theme${model.themes.length === 1 ? "" : "s"} (${model.themes.map((theme) => escapeText(theme)).join(", ")})`
      : "no themes";
  const sections = [
    `# ${escapeText(model.title)}`,
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

  if (model.components.length > 0) {
    sections.push("## Component APIs");
    for (const component of model.components) {
      sections.push(renderComponentMarkdown(component, 3));
    }
  }

  return `${sections.join("\n\n")}\n`;
}

export function generateDesignMdFiles(
  ctx: PluginContext,
  options: DesignMdPluginOptions,
): OutputFile[] {
  const model = buildDocsModel(ctx, options.title ?? "Design system");
  return [{ filename: "DESIGN.md", content: renderMarkdown(model) }];
}

export function designMD(options: DesignMdPluginOptions): RecontentPlugin {
  return outputPlugin(
    "recontent:design-md",
    ["tokens", "components?"],
    options,
    generateDesignMdFiles,
  );
}
