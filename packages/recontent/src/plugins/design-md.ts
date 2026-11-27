import { expandedMembers } from "../token-model/composite.js";
import { pathKey } from "../token-model/guards.js";
import { type ComponentInfo } from "../introspection/model.js";
import { type PluginContext, type RecontentPlugin } from "./types.js";
import { type ThemeAxis, type TokenEntry } from "../token-model/registry.js";
import type { OutputFile } from "./shared/context.js";
import { code, escapeText } from "../markdown.js";
import { groupByCategory } from "../introspection/markdown.js";
import { serializeValueCss } from "../serialize/values.js";
import { outputPlugin } from "./factory.js";
import { buildToken, deprecation, type DocToken } from "../snapshot/doc-token.js";
import { numericCompare } from "../snapshot/snapshot.js";
import { resolveEntryValue } from "../token-model/alias.js";

export type DesignMdPluginOptions = {
  outDir: string;
  /** Defaults to `DESIGN.md`. */
  filename?: string;
  /** Document name, used in the front matter and as the heading. Defaults to "Design system". */
  title?: string;
  /** What the design system is for. Written to the front matter and the Overview. */
  description?: string;
  /**
   * The published package name (e.g. `"@acme/ds"`). When set, the commands the
   * document suggests include `--from <packageName>`, for consumers who have the
   * package installed but not this config.
   */
  packageName?: string;
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

const YAML_RESERVED_RE = /^(?:true|false|null|yes|no|on|off|y|n|~)$/i;
const YAML_NUMBER_RE = /^[+-]?(?:0|[1-9]\d*)(?:\.\d+)?$/;

const yamlKey = (key: string) =>
  /^[A-Za-z0-9_-]+$/.test(key) && !YAML_RESERVED_RE.test(key) && !YAML_NUMBER_RE.test(key)
    ? key
    : JSON.stringify(key);

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

function buildItem(ctx: PluginContext, entry: TokenEntry): Item {
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
    token: buildToken(ctx, entry),
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

/** ` --from @acme/ds` when the document is for the package's consumers, else nothing. */
function fromArgument(options: DesignMdPluginOptions): string {
  const name = options.packageName?.trim();
  if (!name) return "";
  return ` --from ${/\s/.test(name) ? JSON.stringify(name) : name}`;
}

function overview(
  items: Item[],
  hasComponents: boolean,
  options: DesignMdPluginOptions,
): string | undefined {
  const example = items.find((item) => item.entry.layer === "system") ?? items[0];
  const parts: string[] = [];
  if (options.description) parts.push(options.description);
  if (example) {
    parts.push(
      `Keys mirror token paths and CSS variables: ${code(example.key)} is ${code(example.token.path)} (${code(example.token.cssVar)}).`,
    );
  }
  if (example || hasComponents) {
    const from = fromArgument(options);
    parts.push(
      `Query tokens, props and types on demand with ${code(`recontent inspect${from}`)} (or over MCP with ${code(`recontent mcp${from}`)}).`,
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
    const description = (entry.scale ?? ctx.groups.get(groupPath))?.$description;
    if (description !== undefined && !scales.has(groupPath)) {
      scales.add(groupPath);
      lines.push(`- ${code(entry.path.slice(0, -1).join("-"))}: ${escapeText(description)}`);
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
function themeTable(items: Item[], axes: readonly ThemeAxis[]): string | undefined {
  if (axes.length === 0) return undefined;

  if (axes.length === 1) {
    const axis = axes[0]!;
    const contextNames = Object.keys(axis.contexts);
    const overridden = items.filter((item) => Object.keys(item.token.values).length > 1);
    const columns = contextNames.filter((ctx) => overridden.some((item) => item.token.values[ctx]));
    if (columns.length === 0) return undefined;
    const header = ["Token", escapeText(axis.default), ...columns.map((ctx) => escapeText(ctx))];
    const rows = overridden.map((item) => [
      code(item.key),
      code(item.token.values.default ?? ""),
      ...columns.map((ctx) => (item.token.values[ctx] ? code(item.token.values[ctx]!) : "—")),
    ]);
    return [
      "Themes override these tokens:",
      "",
      `| ${header.join(" | ")} |`,
      `| ${header.map(() => "---").join(" | ")} |`,
      ...rows.map((row) => `| ${row.join(" | ")} |`),
    ].join("\n");
  }

  const axisBlocks: string[] = [];
  for (const axis of axes) {
    const contextNames = Object.keys(axis.contexts);
    const valueKey = (ctx: string) => `${axis.name}=${ctx}`;
    const overridden = items.filter((item) =>
      contextNames.some((ctx) => item.token.values[valueKey(ctx)] !== undefined),
    );
    const columns = contextNames.filter((ctx) =>
      overridden.some((item) => item.token.values[valueKey(ctx)] !== undefined),
    );
    if (columns.length === 0) continue;
    const header = ["Token", escapeText(axis.default), ...columns.map((ctx) => escapeText(ctx))];
    const rows = overridden.map((item) => [
      code(item.key),
      code(item.token.values.default ?? ""),
      ...columns.map((ctx) => {
        const val = item.token.values[valueKey(ctx)];
        return val ? code(val) : "—";
      }),
    ]);
    axisBlocks.push(
      [
        `### ${escapeText(axis.name)}`,
        ...(axis.description ? ["", escapeText(axis.description)] : []),
        "",
        `| ${header.join(" | ")} |`,
        `| ${header.map(() => "---").join(" | ")} |`,
        ...rows.map((row) => `| ${row.join(" | ")} |`),
      ].join("\n"),
    );
  }

  const combinedRows: string[][] = [];
  for (const item of items) {
    for (const [key, val] of Object.entries(item.token.values)) {
      if (!key.includes(",")) continue;
      combinedRows.push([code(item.key), code(key.replaceAll(",", ", ")), code(val)]);
    }
  }
  if (combinedRows.length > 0) {
    axisBlocks.push(
      [
        "### Combined overrides",
        "",
        "| Token | Combination | Value |",
        "| --- | --- | --- |",
        ...combinedRows.map((row) => `| ${row.join(" | ")} |`),
      ].join("\n"),
    );
  }

  if (axisBlocks.length === 0) return undefined;
  return [
    `Theme axes apply in resolution order: ${axes.map((axis) => code(axis.name)).join(" → ")}.`,
    "",
    axisBlocks.join("\n\n"),
  ].join("\n");
}

function componentLines(components: ComponentInfo[], options: DesignMdPluginOptions): string[] {
  const active = components.filter((component) => !component.deprecated);
  if (active.length === 0) return [];
  const bullet = (component: ComponentInfo) => {
    const summary = component.description?.split(/\r?\n\s*\n/)[0];
    const tag = component.experimental ? " (experimental)" : "";
    return `- **${escapeText(component.name)}**${tag}${summary ? `: ${escapeText(summary)}` : ""}`;
  };
  const groups = groupByCategory(active);
  // Headings only where the components have categories: a flat list stays flat.
  const lines = groups.flatMap(({ category, components }) => [
    ...(category ? [`### ${escapeText(category)}`, ""] : []),
    ...components.map(bullet),
    ...(category ? [""] : []),
  ]);
  if (lines.at(-1) === "") lines.pop();
  return [
    ...lines,
    "",
    `Run ${code(`recontent inspect components <Name>${fromArgument(options)}`)} for props, usage and examples.`,
  ];
}

/** `reason` is Markdown: escape what comes from a token's metadata before passing it in. */
function avoid(subject: string, reason?: string): string {
  return `- Don't use ${subject}${reason ? `: ${reason}` : "."}`;
}

const reasonText = (deprecated: true | string) =>
  typeof deprecated === "string" ? escapeText(deprecated) : undefined;

function guidance(
  ctx: PluginContext,
  items: Item[],
  components: ComponentInfo[],
  options: DesignMdPluginOptions,
) {
  const lines = [
    ...(options.dos ?? []).map((text) => `- Do ${text}`),
    ...(options.donts ?? []).map((text) => `- Don't ${text}`),
  ];
  const scales = new Set<string>();
  for (const { entry, token, ref, key } of items) {
    const scale = deprecation(
      (entry.scale ?? ctx.groups.get(pathKey(entry.path.slice(0, -1))))?.$deprecated,
    );
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
  // Not worth an inspect round trip: an agent would write these props before looking them up.
  for (const component of components) {
    if (component.deprecated) continue;
    for (const prop of component.props) {
      if (!prop.deprecated) continue;
      lines.push(
        avoid(`${code(component.name)} prop ${code(prop.name)}`, reasonText(prop.deprecated)),
      );
    }
  }
  return lines;
}

export function generateDesignMdFiles(
  ctx: PluginContext,
  options: DesignMdPluginOptions,
): OutputFile[] {
  const items = [...ctx.registry.values()]
    .map((entry) => ({ key: pathKey(entry.path), entry }))
    .sort((a, b) => numericCompare(a.key, b.key))
    .map(({ entry }) => buildItem(ctx, entry));
  const components = ctx.components ?? [];
  const title = options.title ?? "Design system";

  const sections: string[] = [];
  const add = (heading: string, body: string | undefined) => {
    if (body) sections.push(`## ${heading}\n\n${body}`);
  };

  add("Overview", overview(items, components.length > 0, options));
  for (const section of SECTIONS) {
    add(section, sectionLines(ctx, section, items).join("\n"));
  }
  add("Themes", themeTable(items, ctx.themes));
  add("Components", componentLines(components, options).join("\n"));
  add("Do's and Don'ts", guidance(ctx, items, components, options).join("\n"));

  const content = [frontMatter(ctx, items, options), `# ${escapeText(title)}`, ...sections].join(
    "\n\n",
  );
  return [{ filename: options.filename ?? "DESIGN.md", content: `${content}\n` }];
}

export function designMD(options: DesignMdPluginOptions): RecontentPlugin {
  return outputPlugin(
    "recontent:design-md",
    ["tokens", "introspection?"],
    options,
    generateDesignMdFiles,
  );
}
