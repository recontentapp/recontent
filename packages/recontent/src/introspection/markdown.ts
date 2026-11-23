import type { ComponentInfo, Documentation, InheritedProps, PropInfo, TypeInfo } from "./model.js";
import { code, escapeText } from "../markdown.js";

/** `Accordion<Value extends string>` for a generic component, else its name. */
function displayName({ name, typeParameters }: ComponentInfo | TypeInfo): string {
  if (!typeParameters?.length) return name;
  const parameters = typeParameters.map(
    (parameter) =>
      parameter.name +
      (parameter.constraint ? ` extends ${parameter.constraint}` : "") +
      (parameter.default ? ` = ${parameter.default}` : ""),
  );
  return `${name}<${parameters.join(", ")}>`;
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
export function propCount({ props }: { props: unknown[] }): string {
  return `${props.length} ${props.length === 1 ? "prop" : "props"}`;
}

/** How much of a long prop to print: the first values of a union, the first members of a long type. */
export type Brevity = { maxValues: number; maxTypeLength: number };

/** `a | b | …` cut at a union member once it is longer than `max`. */
function shortenType(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.lastIndexOf(" | ", max);
  return cut > 0 ? `${text.slice(0, cut)} | …` : `${text.slice(0, max).trimEnd()} …`;
}

function typeCell(prop: PropInfo, brevity?: Brevity): string {
  if (prop.values) {
    const shown = brevity ? prop.values.slice(0, brevity.maxValues) : prop.values;
    const more = prop.values.length - shown.length;
    return (
      code(shown.map((value) => JSON.stringify(value)).join(" | ")) +
      (more > 0 ? ` … ${more} more` : "")
    );
  }
  const text = (value: string) => code(brevity ? shortenType(value, brevity.maxTypeLength) : value);
  return prop.resolved ? `${text(prop.type)}<br>${text(prop.resolved)}` : text(prop.type);
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
function fenced(text: string, language: string): string[] {
  const fence = "`".repeat(Math.max(3, ...(text.match(/`+/g) ?? []).map((run) => run.length + 1)));
  return [`${fence}${language}`, text, fence];
}

/** `Usage`, `Links`, `Stories` and `Examples`, one level below the item's heading. */
function documentationLines(
  item: Documentation & { stories?: string[] },
  headingLevel: number,
): string[] {
  const heading = "#".repeat(headingLevel + 1);
  const lines: string[] = [];
  // Usage is markdown, fenced so that its own headings (an h1, say) don't break ours.
  if (item.usage) lines.push(`${heading} Usage`, "", ...fenced(item.usage, "md"), "");
  if (item.externalLinks?.length) {
    lines.push(`${heading} Links`, "");
    for (const { title, url } of item.externalLinks)
      lines.push(`- [${escapeText(title ?? url)}](${url.replace(/\)/g, "%29")})`);
    lines.push("");
  }
  if (item.stories?.length) {
    lines.push(`${heading} Stories`, "", ...item.stories.map((file) => `- ${code(file)}`), "");
  }
  if (item.examples?.length) {
    lines.push(`${heading} Examples`, "");
    for (const example of item.examples) {
      if (example.title) lines.push(`**${escapeText(example.title)}**`, "");
      lines.push(...fenced(example.code, "tsx"), "");
    }
  }
  return lines;
}

/** `Source: src/button.tsx:12` */
function sourceLine(component: ComponentInfo | TypeInfo): string {
  return `Source: ${code(`${component.sourceFilePath}:${component.line}`)}`;
}

/** Props a project type declares that are left out of the table, to be asked for with `--props`. */
type CollapsedProps = { type: string; props: string[] };

const COLLAPSED_NAMES = 8;

function inheritsLine(
  inherits: InheritedProps[],
  collapsed: CollapsedProps[] = [],
): string | undefined {
  if (inherits.length + collapsed.length === 0) return undefined;
  const shared = collapsed.map(({ type, props }) => {
    const names = props.slice(0, COLLAPSED_NAMES).join(", ");
    return `${code(type)} (${propCount({ props })}: ${names}${props.length > COLLAPSED_NAMES ? ", …" : ""})`;
  });
  const groups = inherits.map(
    (group) =>
      `${code(group.name)} (${propCount(group)}${group.package ? ` from ${group.package}` : ""})`,
  );
  return `Also accepts: ${[...shared, ...groups].join(", ")}`;
}

function renderPropsTable(props: PropInfo[], brevity?: Brevity): string[] {
  const header = ["Prop", "Type", "Default", "Required", "Notes"];
  const lines = [`| ${header.join(" | ")} |`, `| ${header.map(() => "---").join(" | ")} |`];
  for (const prop of props) {
    const row = [
      code(prop.name),
      typeCell(prop, brevity),
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
  if ("import" in item && item.import) lines.push(`Import: ${code(item.import)}`, "");
  lines.push(sourceLine(item), "", ...documentationLines(item, headingLevel));
  return lines;
}

/** What of a component to print; all of it by default. */
export type ComponentView = {
  /** The props of the table, in the order given. */
  props?: PropInfo[];
  collapsed?: CollapsedProps[];
  brevity?: Brevity;
  /** Leaves out the "Also accepts" line. */
  hideInherits?: boolean;
};

export function renderComponentMarkdown(
  component: ComponentInfo,
  headingLevel: number,
  view: ComponentView = {},
): string {
  const { props = component.props, collapsed = [], brevity } = view;
  const lines = headerLines(component, headingLevel);
  if (props.length > 0) {
    lines.push(...renderPropsTable(props, brevity), "");
  } else if (collapsed.length === 0 && !view.hideInherits) {
    lines.push("_No own props._", "");
  }

  const inherits = view.hideInherits ? undefined : inheritsLine(component.inherits, collapsed);
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
