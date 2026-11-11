import {
  expandedMembers,
  pathKey,
  type ComponentInfo,
  type OutputFile,
  type PluginContext,
  type RecontentPlugin,
  type TokenEntry,
} from "@recontentapp/core";
import { code, escapeText } from "../markdown.js";
import { serializeValueCss } from "../serialize/values.js";
import { outputPlugin } from "./factory.js";
import { buildToken, deprecation, type DocToken } from "./shared/doc-token.js";
import { resolveEntryValue } from "./shared/ts-source.js";

export type DesignMdPluginOptions = {
  outDir: string;
  /** Document name, used in the front matter and as the heading. Defaults to "Design system". */
  title?: string;
  /** What the design system is for. Written to the front matter and the Overview. */
  description?: string;
  /** Written under "Do's and Don'ts" as `Do <item>`. */
  dos?: string[];
  /** Written under "Do's and Don'ts" as `Don't <item>`, before the deprecations. */
  donts?: string[];
};

type YamlGroup = "colors" | "typography" | "rounded" | "spacing" | "components";

type Section = "Colors" | "Typography" | "Layout" | "Elevation & Depth" | "Shapes";

const SECTIONS: Section[] = ["Colors", "Typography", "Layout", "Elevation & Depth", "Shapes"];

const RADIUS_RE = /radius|radii|rounded|corner/i;
const SPACING_RE = /spac|gap|padding|margin|inset/i;

/** Where a token goes: the front matter group it is written to, and the prose section describing it. */
function classify(entry: TokenEntry): { group?: YamlGroup; section?: Section } {
  const inPath = (pattern: RegExp) => entry.path.some((segment) => pattern.test(segment));
  const group: YamlGroup | undefined = (() => {
    if (entry.layer === "components") return "components";
    switch (entry.$type) {
      case "color":
        return "colors";
      case "typography":
        return "typography";
      case "dimension":
        if (inPath(RADIUS_RE)) return "rounded";
        return inPath(SPACING_RE) ? "spacing" : undefined;
      default:
        return undefined;
    }
  })();

  // Component tokens are described by the Components section; motion types have no section.
  if (entry.layer === "components") return { group };
  switch (entry.$type) {
    case "color":
    case "gradient":
      return { group, section: "Colors" };
    case "typography":
    case "fontFamily":
    case "fontWeight":
      return { group, section: "Typography" };
    case "dimension":
      return { group, section: group === "rounded" ? "Shapes" : "Layout" };
    case "shadow":
      return { group, section: "Elevation & Depth" };
    case "border":
      return { group, section: "Shapes" };
    default:
      return { group };
  }
}

/** A component token's path starts with the component's name: `[switch, trackWidth]`. */
function componentField(entry: TokenEntry): [component: string, field: string] {
  const [component = "", ...rest] = entry.path;
  return [component, rest.join("-") || component];
}

const yamlKey = (key: string) => (/^[A-Za-z0-9_-]+$/.test(key) ? key : JSON.stringify(key));

/** Typography members are resolved to values: `fontWeight` and `lineHeight` are numbers in the spec. */
function typographyValue(ctx: PluginContext, entry: TokenEntry): string {
  const members = expandedMembers(
    "typography",
    resolveEntryValue(ctx.registry, entry) as Parameters<typeof expandedMembers>[1],
  );
  const fields = members.map(({ cssProperty, type, member }) => {
    const text = serializeValueCss(type, member.$value as never);
    const numeric = cssProperty === "fontWeight" || cssProperty === "lineHeight";
    return `${cssProperty}: ${numeric ? Number(text) : JSON.stringify(text)}`;
  });
  return `{ ${fields.join(", ")} }`;
}

type Item = {
  entry: TokenEntry;
  token: DocToken;
  group?: YamlGroup;
  section?: Section;
  /** The path joined with `-`: the CSS variable name without its leading `--`. */
  key: string;
  /** `{group.key}`, the way other tokens refer to this one. Only for tokens in the front matter. */
  ref?: string;
};

function buildItem(ctx: PluginContext, entry: TokenEntry, themes: string[]): Item {
  const { group, section } = classify(entry);
  const key = entry.path.join("-");
  let ref: string | undefined;
  if (group === "components") {
    const [component = "", field] = componentField(entry);
    ref = `{components.${component}.${field}}`;
  } else if (group) {
    ref = `{${group}.${key}}`;
  }
  return {
    entry,
    token: buildToken(ctx, entry, themes),
    ...(group ? { group } : {}),
    ...(section ? { section } : {}),
    key,
    ...(ref ? { ref } : {}),
  };
}

/** The default value as CSS, with aliases inside composites as `var(--ref-color-white)`: the keys of the front matter. */
function cssValue(ctx: PluginContext, { entry, token }: Item): string {
  if (entry.$type === "transition") return token.values.default ?? "";
  return serializeValueCss(entry.$type, resolveEntryValue(ctx.registry, entry) as never);
}

function frontMatter(ctx: PluginContext, items: Item[], options: DesignMdPluginOptions): string {
  const refs = new Map(items.flatMap((item) => (item.ref ? [[item.token.path, item.ref]] : [])));
  const value = (item: Item): string => {
    const target = item.token.alias ? refs.get(item.token.alias) : undefined;
    if (target) return JSON.stringify(target);
    if (item.entry.$type === "typography") return typographyValue(ctx, item.entry);
    return JSON.stringify(cssValue(ctx, item));
  };

  const lines = [
    "---",
    "version: alpha",
    `name: ${JSON.stringify(options.title ?? "Design system")}`,
  ];
  if (options.description) lines.push(`description: ${JSON.stringify(options.description)}`);

  const flat = (group: Exclude<YamlGroup, "components">) => {
    const members = items.filter((item) => item.group === group);
    if (members.length === 0) return;
    lines.push(`${group}:`);
    for (const item of members) lines.push(`  ${yamlKey(item.key)}: ${value(item)}`);
  };
  flat("colors");
  flat("typography");
  flat("rounded");
  flat("spacing");

  const components = new Map<string, string[]>();
  for (const item of items) {
    if (item.group !== "components") continue;
    const [component = "", field = ""] = componentField(item.entry);
    const fields = components.get(component) ?? [];
    fields.push(`    ${yamlKey(field)}: ${value(item)}`);
    components.set(component, fields);
  }
  if (components.size > 0) {
    lines.push("components:");
    for (const [component, fields] of components) lines.push(`  ${yamlKey(component)}:`, ...fields);
  }

  lines.push("---");
  return lines.join("\n");
}

function overview(items: Item[], description: string | undefined): string | undefined {
  const example = items.find((item) => item.entry.layer === "system") ?? items[0];
  const parts: string[] = [];
  if (description) parts.push(description);
  if (example) {
    parts.push(
      `Keys mirror token paths and CSS variables: ${code(example.key)} is ${code(example.token.path)} (${code(example.token.cssVar)}).`,
    );
  }
  return parts.length > 0 ? parts.join("\n\n") : undefined;
}

/** Descriptions of the tokens and scales of a section, and the value of tokens the front matter doesn't hold. */
function sectionLines(ctx: PluginContext, section: Section, items: Item[]): string[] {
  const lines: string[] = [];
  const scales = new Set<string>();
  for (const item of items) {
    if (item.section !== section) continue;
    const { entry, token } = item;
    const groupPath = pathKey(entry.path.slice(0, -1));
    if (entry.scale?.$description !== undefined && !scales.has(groupPath)) {
      scales.add(groupPath);
      lines.push(
        `- ${code(entry.path.slice(0, -1).join("-"))}: ${escapeText(entry.scale.$description)}`,
      );
    }
    if (item.group) {
      if (token.description) lines.push(`- ${code(item.key)}: ${escapeText(token.description)}`);
    } else {
      const description = token.description ? ` — ${escapeText(token.description)}` : "";
      lines.push(`- ${code(item.key)}: ${code(cssValue(ctx, item))}${description}`);
    }
  }
  return lines;
}

/** The tokens a theme overrides, with the value each theme gives them. */
function themeTable(items: Item[], themes: string[]): string | undefined {
  const overridden = items.filter((item) => Object.keys(item.token.values).length > 1);
  const columns = themes.filter((theme) => overridden.some((item) => item.token.values[theme]));
  if (columns.length === 0) return undefined;
  const header = ["Token", "default", ...columns.map((theme) => escapeText(theme))];
  const rows = overridden.map((item) => [
    code(item.key),
    code(item.token.values.default ?? ""),
    ...columns.map((theme) => (item.token.values[theme] ? code(item.token.values[theme]) : "—")),
  ]);
  return [
    `Themes override these tokens:`,
    "",
    `| ${header.join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

function componentLines(components: ComponentInfo[]): string[] {
  const active = components.filter((component) => !component.deprecated);
  if (active.length === 0) return [];
  const lines = active.map((component) => {
    const summary = component.description?.split(/\r?\n\s*\n/)[0];
    return `- **${escapeText(component.name)}**${summary ? `: ${escapeText(summary)}` : ""}`;
  });
  return [...lines, "", "Run `recontent inspect components <Name>` for props, usage and examples."];
}

/** `reason` is Markdown: escape what comes from a token's metadata before passing it in. */
function avoid(subject: string, reason?: string): string {
  return `- Don't use ${subject}${reason ? `: ${reason}` : "."}`;
}

const reasonText = (deprecated: true | string) =>
  typeof deprecated === "string" ? escapeText(deprecated) : undefined;

function guidance(items: Item[], components: ComponentInfo[], options: DesignMdPluginOptions) {
  const lines = [
    ...(options.dos ?? []).map((text) => `- Do ${text}`),
    ...(options.donts ?? []).map((text) => `- Don't ${text}`),
  ];
  const scales = new Set<string>();
  for (const { entry, token, ref, key } of items) {
    const scale = deprecation(entry.scale?.$deprecated);
    const scaleKey = entry.path.slice(0, -1).join("-");
    if (scale !== undefined && !scales.has(scaleKey)) {
      scales.add(scaleKey);
      lines.push(avoid(code(scaleKey), reasonText(scale)));
    }
    if (token.deprecated) lines.push(avoid(code(ref ?? key), reasonText(token.deprecated)));
  }
  for (const component of components) {
    if (!component.deprecated) continue;
    const reason =
      component.deprecated === true
        ? component.replacement && `Use ${code(component.replacement)}.`
        : escapeText(component.deprecated);
    lines.push(avoid(code(component.name), reason));
  }
  return lines;
}

export function generateDesignMdFiles(
  ctx: PluginContext,
  options: DesignMdPluginOptions,
): OutputFile[] {
  const themes = Object.keys(ctx.themes);
  const items = [...ctx.registry.values()]
    .sort((a, b) => pathKey(a.path).localeCompare(pathKey(b.path), undefined, { numeric: true }))
    .map((entry) => buildItem(ctx, entry, themes));
  const components = ctx.components ?? [];
  const title = options.title ?? "Design system";

  const sections: string[] = [];
  const add = (heading: string, body: string | undefined) => {
    if (body) sections.push(`## ${heading}\n\n${body}`);
  };

  add("Overview", overview(items, options.description));
  for (const section of SECTIONS) {
    const list = sectionLines(ctx, section, items).join("\n");
    const table = section === "Colors" ? themeTable(items, themes) : undefined;
    add(section, [list, table].filter(Boolean).join("\n\n"));
  }
  add("Components", componentLines(components).join("\n"));
  add("Do's and Don'ts", guidance(items, components, options).join("\n"));

  const content = [frontMatter(ctx, items, options), `# ${escapeText(title)}`, ...sections].join(
    "\n\n",
  );
  return [{ filename: "DESIGN.md", content: `${content}\n` }];
}

export function designMD(options: DesignMdPluginOptions): RecontentPlugin {
  return outputPlugin(
    "recontent:design-md",
    ["tokens", "introspection?"],
    options,
    generateDesignMdFiles,
  );
}
