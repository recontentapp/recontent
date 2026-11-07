import type { ComponentInfo, InheritedProps, PropInfo, TypeInfo } from "@recontentapp/core";
import { code, escapeText } from "../markdown.js";

/** `Accordion<Value extends string>` for a generic component, else its name. */
export function displayName({ name, typeParameters }: ComponentInfo | TypeInfo): string {
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
export function updatedText(component: { lastUpdatedAt?: string }): string | undefined {
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
function sourceLine(component: ComponentInfo | TypeInfo): string {
  return [
    `Source: ${code(`${component.sourceFilePath}:${component.line}`)}`,
    "lastUpdatedAt" in component ? updatedText(component) : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

function inheritsLine(inherits: InheritedProps[]): string | undefined {
  if (inherits.length === 0) return undefined;
  const groups = inherits.map(
    (group) =>
      `${code(group.name)} (${propCount(group)}${group.package ? ` from ${group.package}` : ""})`,
  );
  return `Also accepts: ${groups.join(", ")}`;
}

function renderPropsTable(props: PropInfo[]): string[] {
  const header = ["Prop", "Type", "Default", "Required", "Notes"];
  const lines = [`| ${header.join(" | ")} |`, `| ${header.map(() => "---").join(" | ")} |`];
  for (const prop of props) {
    const row = [
      code(prop.name),
      typeCell(prop),
      prop.defaultValue ? code(prop.defaultValue) : "—",
      prop.required ? "yes" : "no",
      notes(prop),
    ];
    lines.push(`| ${row.join(" | ")} |`);
  }
  return lines;
}

/** Heading, description and deprecation, source: what both components and types start with. */
function headerLines(item: ComponentInfo | TypeInfo, headingLevel: number): string[] {
  const lines = [`${"#".repeat(headingLevel)} ${escapeText(displayName(item))}`, ""];
  if (item.description) lines.push(escapeText(item.description), "");
  if (item.deprecated) {
    lines.push(
      item.deprecated === true
        ? "> ⚠️ Deprecated"
        : `> ⚠️ Deprecated: ${escapeText(item.deprecated)}`,
      "",
    );
  }
  lines.push(sourceLine(item), "");
  return lines;
}

export function renderComponentMarkdown(component: ComponentInfo, headingLevel: number): string {
  const lines = headerLines(component, headingLevel);
  if (component.props.length === 0) {
    lines.push("_No own props._", "");
  } else {
    lines.push(...renderPropsTable(component.props), "");
  }

  const inherits = inheritsLine(component.inherits);
  if (inherits) lines.push(inherits, "");
  return lines.join("\n").trimEnd();
}

/** Members as a table, literal unions as their values, anything else as its declaration. */
export function renderTypeMarkdown(type: TypeInfo, headingLevel: number): string {
  const lines = headerLines(type, headingLevel);
  if (type.members?.length) {
    lines.push(...renderPropsTable(type.members), "");
  } else if (type.values && type.kind !== "enum") {
    lines.push(`Values: ${type.values.map((value) => code(JSON.stringify(value))).join(", ")}`, "");
  } else {
    // An enum's member names are not in its values.
    lines.push("```ts", type.definition, "```", "");
  }

  const inherits = inheritsLine(type.inherits ?? []);
  if (inherits) lines.push(inherits, "");
  if (type.references.length > 0) {
    lines.push(`References: ${type.references.map(code).join(", ")}`, "");
  }
  return lines.join("\n").trimEnd();
}
