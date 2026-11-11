import type {
  ComponentInfo,
  Documentation,
  InheritedProps,
  PropInfo,
  TypeInfo,
} from "@recontentapp/core";
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

/**
 * Components by `category`, alphabetically, the uncategorised last. A single
 * group without a category when none of them has one.
 */
export function groupByCategory(
  components: ComponentInfo[],
): { category?: string; components: ComponentInfo[] }[] {
  const groups = new Map<string | undefined, ComponentInfo[]>();
  for (const component of components) {
    const group = groups.get(component.category);
    if (group) group.push(component);
    else groups.set(component.category, [component]);
  }
  return [...groups]
    .sort(([a], [b]) => (a === undefined ? 1 : b === undefined ? -1 : a.localeCompare(b)))
    .map(([category, inGroup]) => ({ ...(category ? { category } : {}), components: inGroup }));
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
  if (prop.experimental) {
    parts.push(
      prop.experimental === true
        ? "**Experimental**"
        : `**Experimental**: ${escapeText(prop.experimental, "<br>")}`,
    );
  }
  // Multi-line examples are left to the JSON output: a table cell is no place for them.
  const example = prop.examples?.find(({ code: text }) => !text.includes("\n"));
  if (example) parts.push(`Example: ${code(example.code)}`);
  return parts.join("<br>");
}

/** A fence longer than any run of backticks in the code. */
function fenced(text: string): string[] {
  const fence = "`".repeat(Math.max(3, ...(text.match(/`+/g) ?? []).map((run) => run.length + 1)));
  return [`${fence}tsx`, text, fence];
}

/** `Usage`, `Links` and `Examples`, one level below the item's heading. */
function documentationLines(item: Documentation, headingLevel: number): string[] {
  const heading = "#".repeat(headingLevel + 1);
  const lines: string[] = [];
  // Usage is markdown by design: written as is.
  if (item.usage) lines.push(`${heading} Usage`, "", item.usage, "");
  if (item.externalLinks?.length) {
    lines.push(`${heading} Links`, "");
    for (const { title, url } of item.externalLinks)
      lines.push(`- [${escapeText(title ?? url)}](${url})`);
    lines.push("");
  }
  if (item.examples?.length) {
    lines.push(`${heading} Examples`, "");
    for (const example of item.examples) {
      if (example.title) lines.push(`**${escapeText(example.title)}**`, "");
      lines.push(...fenced(example.code), "");
    }
  }
  return lines;
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

/** Heading, description and deprecation, source, usage and examples: what both components and types start with. */
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
    if (item.replacement) lines.push(`Replaced by: ${code(item.replacement)}`, "");
  }
  if (item.experimental) {
    lines.push(
      item.experimental === true
        ? "> 🧪 Experimental"
        : `> 🧪 Experimental: ${escapeText(item.experimental)}`,
      "",
    );
  }
  lines.push(sourceLine(item), "", ...documentationLines(item, headingLevel));
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
