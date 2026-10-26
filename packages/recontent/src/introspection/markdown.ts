import type { ComponentInfo, InheritedProps, PropInfo } from "@recontentapp/core";
import { code, escapeText } from "../markdown.js";

/** `Accordion<Value extends string>` for a generic component, else its name. */
export function displayName({ name, typeParameters }: ComponentInfo): string {
  if (!typeParameters?.length) return name;
  const parameters = typeParameters.map(
    (parameter) =>
      parameter.name +
      (parameter.constraint ? ` extends ${parameter.constraint}` : "") +
      (parameter.default ? ` = ${parameter.default}` : ""),
  );
  return `${name}<${parameters.join(", ")}>`;
}

/** "Updated 2025-03-01" when the component has a last commit date. */
export function updatedText(component: ComponentInfo): string | undefined {
  return component.lastUpdatedAt ? `Updated ${component.lastUpdatedAt.slice(0, 10)}` : undefined;
}

/** "53 props" */
export function propCount({ props }: InheritedProps): string {
  return `${props.length} ${props.length === 1 ? "prop" : "props"}`;
}

function typeCell(prop: PropInfo): string {
  if (prop.values) return code(prop.values.map((value) => JSON.stringify(value)).join(" | "));
  return prop.resolved ? `${code(prop.type)}<br>${code(prop.resolved)}` : code(prop.type);
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

/** `src/button.tsx:12` */
function sourceLine(component: ComponentInfo): string {
  return [
    `Source: ${code(`${component.sourceFilePath}:${component.line}`)}`,
    updatedText(component),
  ]
    .filter(Boolean)
    .join(" · ");
}

function inheritsLine(component: ComponentInfo): string | undefined {
  if (component.inherits.length === 0) return undefined;
  const groups = component.inherits.map(
    (group) =>
      `${code(group.name)} (${propCount(group)}${group.package ? ` from ${group.package}` : ""})`,
  );
  return `Also accepts: ${groups.join(", ")}`;
}

export function renderComponentMarkdown(component: ComponentInfo, headingLevel: number): string {
  const lines = [`${"#".repeat(headingLevel)} ${escapeText(displayName(component))}`, ""];
  if (component.description) lines.push(escapeText(component.description), "");
  if (component.deprecated) {
    lines.push(
      component.deprecated === true
        ? "> ⚠️ Deprecated"
        : `> ⚠️ Deprecated: ${escapeText(component.deprecated)}`,
      "",
    );
  }
  lines.push(sourceLine(component), "");

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
