import type { ComponentInfo, GitInfo, PropInfo } from "@recontentapp/core";
import { sourceUrl } from "../git.js";
import { code, escapeText } from "../markdown.js";

function typeCell(prop: PropInfo): string {
  return code(
    prop.values ? prop.values.map((value) => JSON.stringify(value)).join(" | ") : prop.type,
  );
}

function notes(prop: PropInfo): string {
  const parts: string[] = [];
  if (prop.description) parts.push(escapeText(prop.description, "<br>"));
  if (prop.deprecated) {
    parts.push(
      prop.deprecated === true
        ? "**Deprecated**"
        : `**Deprecated**: ${escapeText(prop.deprecated, "<br>")}`,
    );
  }
  return parts.join("<br>");
}

/** `src/button.tsx:12`, linked to the repository when there is a web remote. */
function sourceLine(component: ComponentInfo, git: GitInfo | undefined): string {
  const label = code(`${component.sourceFilePath}:${component.line}`);
  const url = git && sourceUrl(git, component.sourceFilePath, component.line);
  const updated = component.history?.updated.date.slice(0, 10);
  return [`Source: ${url ? `[${label}](${url})` : label}`, updated ? `Updated ${updated}` : ""]
    .filter(Boolean)
    .join(" · ");
}

function inheritsLine(component: ComponentInfo): string | undefined {
  if (component.inherits.length === 0) return undefined;
  const groups = component.inherits.map(
    ({ name, package: pkg, count }) =>
      `${code(name)} (${count} ${count === 1 ? "prop" : "props"}${pkg ? ` from ${pkg}` : ""})`,
  );
  return `Also accepts: ${groups.join(", ")}`;
}

export function renderComponentMarkdown(
  component: ComponentInfo,
  git: GitInfo | undefined,
  headingLevel: number,
): string {
  const lines = [`${"#".repeat(headingLevel)} ${escapeText(component.name)}`, ""];
  if (component.description) lines.push(escapeText(component.description), "");
  if (component.deprecated) {
    lines.push(
      component.deprecated === true
        ? "> ⚠️ Deprecated"
        : `> ⚠️ Deprecated: ${escapeText(component.deprecated)}`,
      "",
    );
  }
  lines.push(sourceLine(component, git), "");

  if (component.props.length === 0) {
    lines.push("_No own props._", "");
  } else {
    const header = ["Prop", "Type", "Default", "Required", "Notes"];
    lines.push(`| ${header.join(" | ")} |`, `| ${header.map(() => "---").join(" | ")} |`);
    for (const prop of component.props) {
      const row = [
        code(prop.name),
        typeCell(prop),
        prop.defaultValue ? code(prop.defaultValue) : "—",
        prop.required ? "yes" : "no",
        notes(prop),
      ];
      lines.push(`| ${row.join(" | ")} |`);
    }
    lines.push("");
  }

  const inherits = inheritsLine(component);
  if (inherits) lines.push(inherits, "");
  return lines.join("\n").trimEnd();
}
