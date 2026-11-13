import { describe, expect, test } from "@jest/globals";
import { defineConfig, defineReferenceTokens, defineSystemTokens, tokens } from "../src/index.js";
import { generateDocsFiles } from "../src/plugins/docs/index.js";
import type { ComponentInfo, PluginContext } from "@recontentapp/core";
import { goldenConfig } from "./helpers/fixtures.js";

type Config = ReturnType<typeof goldenConfig>["config"];

function ctxFor(config: Config): PluginContext {
  return {
    registry: config.registry,
    themes: config.themes,
    root: "/project",
    logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
  };
}

function renderCtx(
  ctx: PluginContext,
  options: { title?: string; gitBaseUrl?: string; color?: string } = {},
): string {
  const files = generateDocsFiles(ctx, { outDir: "docs", ...options });
  expect(files.map((file) => file.filename)).toEqual(["design.html"]);
  return files[0]!.content;
}

const render = (config: Config) => renderCtx(ctxFor(config));

describe("design.html", () => {
  const html = render(goldenConfig().config);

  test("is titled 'Design system' by default, or by option", () => {
    expect(html).toContain("<title>Design system</title>");
    expect(html).toContain("<h1>Design system</h1>");
    const titled = renderCtx(ctxFor(goldenConfig().config), { title: "Acme <Design>" });
    expect(titled).toContain("<title>Acme &lt;Design&gt;</title>");
    expect(titled).toContain("<h1>Acme &lt;Design&gt;</h1>");
  });

  test("color overrides the accent in light and dark mode", () => {
    const override = ':root, :root[data-mode="dark"] { --hig-accent: #e5484d; }';
    expect(html).not.toContain(":root, :root[data-mode=");
    const colored = renderCtx(ctxFor(goldenConfig().config), { color: "#e5484d" });
    // After the built-in light and dark accents, so it wins in both modes.
    expect(colored.indexOf(override)).toBeGreaterThan(colored.indexOf("--hig-accent: #0a84ff"));
  });

  test("has a Design tokens view with one sidebar section per token layer, without an API entry", () => {
    expect(html).toContain('data-view-tab="tokens"');
    expect(html).toContain('data-view="tokens"');
    const side = html.slice(html.indexOf('aria-label="Design tokens"'));
    for (const [layer, title] of [
      ["ref", "Reference"],
      ["system", "System"],
      ["layer-components", "Components"],
    ]) {
      expect(html).toContain(`<div id="${layer}" class="layer">`);
      expect(side).toContain(`<span class="cat">${title}</span>`);
    }
    expect(html).not.toContain('role="tablist" aria-label="Token layers"');
    expect(html).not.toContain("data-tab=");
    expect(html).not.toContain('data-tab="api"');
    expect(html).not.toContain("Component APIs");
  });

  test("has no Components tab without components", () => {
    expect(html).not.toContain('data-view-tab="components"');
    expect(html).not.toContain('<div data-view="components"');
  });

  test("lists the default option and each theme in the picker", () => {
    expect(html).toContain('<option value="">Default</option>');
    expect(html).toContain('<option value="dark">dark</option>');
    expect(html).toContain('<option value="highContrast">highContrast</option>');
  });

  test("embeds token CSS so previews can resolve var(--…)", () => {
    expect(html).toContain("--system-colors-accent: var(--ref-color-black);");
    expect(html).toContain('[data-theme="dark"]');
    expect(html).toContain("var(--system-shadow-elevated)");
  });

  test("renders descriptions and deprecations", () => {
    expect(html).toContain("Primary accent color.");
    expect(html).toContain("Use system.colors.surface instead.");
    expect(html).toContain("Deprecated");
  });

  test("the per-theme value of an aliased system token follows the ref override", () => {
    const match = /data-values="([^"]*)"[^>]*>#000000<\/code>/.exec(
      html.slice(html.indexOf('id="t-system.colors.accent"')),
    );
    expect(match).not.toBeNull();
    const values = JSON.parse(match![1]!.replace(/&quot;/g, '"')) as Record<string, string>;
    expect(values.default).toBeUndefined();
    expect(values.dark).toBe("#eeeeee");
    expect(values.highContrast).toBe("#ff0000");
  });

  test("links aliases to their target token", () => {
    expect(html).toContain('data-goto="t-ref.color.black"');
    expect(html).toContain('id="t-ref.color.black"');
  });

  test("every token is searchable, colours with a swatch", () => {
    const ids = [...html.matchAll(/ id="(t-[^"]+)"/g)].map((match) => match[1]!);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      const tag = new RegExp(
        `<div class="(?:card|row)" id="${id.replace(/\./g, "\\.")}"[^>]*>`,
      ).exec(html)![0];
      expect(tag).toContain("data-search=");
      expect(tag).toContain('data-kind="token"');
    }
    expect(html).toContain(
      'data-search="ref.color.black color Reference" data-kind="token" data-name="ref.color.black" data-meta="color · Reference" data-swatch="--ref-color-black"',
    );
  });

  test("has the search palette", () => {
    expect(html).toContain('id="palette-open"');
    expect(html).toContain("⌘K");
    expect(html).toContain('id="palette"');
    expect(html).toContain('id="palette-input"');
    expect(html).toContain("<kbd>esc</kbd> close");
    expect(html).toContain('role="dialog"');
  });

  test("has a light/dark switch that does not touch token themes", () => {
    const head = html.slice(0, html.indexOf("</head>"));
    expect(html).toContain('id="mode"');
    expect(head.indexOf('"data-mode"')).toBeGreaterThan(-1);
    expect(head.indexOf('"data-mode"')).toBeLessThan(head.indexOf("<style>"));
    expect(html).toContain(':root[data-mode="dark"] {');
    expect(html).not.toMatch(/setAttribute\("data-theme", "(light|dark)"/);
  });

  test("omits the theme picker when there are no themes", () => {
    const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    const output = render(config);
    expect(output).not.toContain('id="theme"');
    expect(output).toContain("No system tokens defined.");
  });
});

describe("escaping", () => {
  const ref = defineReferenceTokens({
    color: {
      evil: tokens.color("#000000").describe('<script>alert("x")</script> */ </style>'),
    },
    palette: tokens
      .colorScale({ 100: "#111111" })
      .describe("Scale <b>desc</b>")
      .deprecate("Use <i>other</i>"),
  });
  const config = defineConfig({ tokens: { ref, system: defineSystemTokens({}), components: {} } });
  const html = render(config);

  test("escapes descriptions", () => {
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).toContain("Scale &lt;b&gt;desc&lt;/b&gt;");
    expect(html).toContain("Use &lt;i&gt;other&lt;/i&gt;");
  });

  test("descriptions cannot break out of the embedded stylesheet", () => {
    expect(html.match(/<\/style>/g)).toHaveLength(2);
  });
});

describe("components", () => {
  const components: ComponentInfo[] = [
    {
      name: "Button",
      sourceFilePath: "src/button.tsx",
      line: 12,
      lastUpdatedAt: "2024-03-01T10:00:00Z",
      description: "Triggers an action.",
      props: [
        {
          name: "variant",
          type: "Variant",
          values: ["solid", "outline"],
          required: false,
          defaultValue: '"solid"',
        },
        {
          name: "width",
          type: "Width",
          resolved: 'number | "auto"',
          required: false,
        },
      ],
      inherits: [],
      references: [],
    },
    {
      name: "Accordion",
      typeParameters: [{ name: "Value", constraint: "string" }],
      sourceFilePath: "src/accordion.tsx",
      line: 3,
      props: [],
      inherits: [],
      references: [],
    },
    {
      name: "Spacer",
      sourceFilePath: "src/spacer.tsx",
      line: 1,
      deprecated: true,
      props: [],
      inherits: [],
      references: [],
    },
  ];
  const withComponents = { ...ctxFor(goldenConfig().config), components };
  const renderWith = (list: ComponentInfo[]) => renderCtx({ ...withComponents, components: list });

  test("get a Components tab and view, with a plain source location", () => {
    const html = renderWith(components);

    expect(html).toContain('data-view-tab="components"');
    expect(html).toContain('data-view="components"');
    expect(html).toContain('<h2 class="title">Components</h2>');
    expect(html).toContain('id="c-Button"');
    expect(html).not.toContain("Source code");
    expect(html).toContain('<span class="note">Updated 2024-03-01</span>');
    expect(html).not.toContain('<a href="http');
  });

  test("without tokens there is no Design tokens tab or view", () => {
    const empty = defineConfig({
      tokens: { ref: defineReferenceTokens({}), system: defineSystemTokens({}), components: {} },
    });
    const html = renderCtx({ ...ctxFor(empty), components });

    expect(html).not.toContain('data-view-tab="tokens"');
    expect(html).not.toContain('data-view="tokens"');
    expect(html).toContain('data-view-tab="components"');
  });

  test("a resolved alias is shown under the type, and type parameters next to the name", () => {
    const html = renderWith(components);

    expect(html).toContain("Accordion&lt;Value extends string&gt;");
    expect(html).toContain("<code>Width</code><code>number |<wbr> &quot;auto&quot;</code>");
  });

  test("a very long type collapses to a preview that expands in place", () => {
    const long = Array.from({ length: 20 }, (_, i) => `"variant-${i}"`).join(" | ");
    const html = renderWith([
      {
        ...components[0]!,
        props: [{ ...components[0]!.props[0]!, type: long, values: undefined }],
      },
    ]);

    expect(html).toContain('<details class="type-long"><summary><code>&quot;variant-0&quot; |');
    expect(html).toContain("…</code><code>&quot;variant-0&quot; |<wbr> ");
  });

  test("without categories there are no category headings", () => {
    const html = renderWith(components);

    expect(html.slice(html.indexOf('aria-label="Components"'))).not.toContain('<span class="cat">');
    expect(html).not.toContain('class="category-title"');
  });

  test("categories are in order, the uncategorised last under 'Other'", () => {
    const html = renderWith([
      { ...components[0]!, category: "Actions" },
      { ...components[1]!, category: "Layout" },
      components[2]!,
    ]);

    const headings = [...html.matchAll(/<h2 class="category-title">([^<]+) <span/g)].map(
      (match) => match[1],
    );
    expect(headings).toEqual(["Actions", "Layout", "Other"]);
    const at = (id: string) => html.indexOf(`<a class="comp-card" href="#${id}"`);
    expect(at("c-Button")).toBeLessThan(at("c-Accordion"));
    expect(at("c-Accordion")).toBeLessThan(at("c-Spacer"));
    // The sidebar follows the same order.
    const side = html.slice(html.indexOf('aria-label="Components"'));
    expect(side.indexOf('<span class="cat">Actions')).toBeLessThan(
      side.indexOf('<span class="cat">Layout'),
    );
  });

  test("usage, examples, replacement and reasons show up", () => {
    const html = renderWith([
      {
        ...components[0]!,
        usage: "Use for <b>primary</b> actions.",
        examples: [{ title: "Basic", code: "<Button />" }, { code: "<Button>\n  Save\n</Button>" }],
      },
      {
        ...components[2]!,
        experimental: "Subject to change.",
        deprecated: "Use `Button`.",
        replacement: "Button",
      },
    ]);

    expect(html).toContain("<h4>Usage</h4>");
    expect(html).toContain("Use for &lt;b&gt;primary&lt;/b&gt; actions.");
    expect(html).toContain(
      '<pre><code>&lt;<span class="tk-tag">Button</span>&gt;\n  Save\n&lt;/<span class="tk-tag">Button</span>&gt;</code></pre>',
    );
    expect(html).not.toContain('class="callout"><span class="capsule');
  });

  test("usage markdown is rendered, never injected as HTML", () => {
    const html = renderWith([
      {
        ...components[0]!,
        usage: [
          "Use for **short** lists, see [docs](https://example.com).",
          "",
          "## Dos",
          "",
          "- Keep rows under ten",
          "- Prefer `Table`",
          "",
          "| A | B |",
          "| - | - |",
          "| 1 | 2 |",
          "",
          "```tsx",
          "<List />",
          "```",
          "",
          "<script>alert(1)</script>",
          "",
          "[bad](javascript:alert(1))",
        ].join("\n"),
      },
    ]);

    expect(html).toContain("<strong>short</strong>");
    expect(html).toContain(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">docs</a>',
    );
    expect(html).toContain("<h6>Dos</h6>");
    expect(html).toContain("<li>Prefer <code>Table</code></li>");
    expect(html).toContain("<table>");
    expect(html).toContain('<span class="tk-tag">List</span>');
    expect(html).not.toContain("<script>alert(1)");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("javascript:");
  });

  test("status badges show their description and replacement in a tooltip", () => {
    const html = renderWith([
      {
        ...components[2]!,
        experimental: "Subject to change.",
        deprecated: "Use <Button>.",
        replacement: "Button",
      },
      { ...components[1]!, experimental: true },
    ]);
    const section = (name: string) => {
      const start = html.indexOf(`<section class="group" id="c-${name}"`);
      return html.slice(start, html.indexOf("</section>", start));
    };

    expect(section("Spacer")).toContain(
      '<span class="capsule exp has-tip" tabindex="0" data-tip="Subject to change.">Experimental</span>',
    );
    expect(section("Spacer")).toContain(
      'data-tip="Use &lt;Button&gt;. Replaced by Button.">Deprecated</span>',
    );
    // No description, no tooltip.
    expect(section("Accordion")).toContain('<span class="capsule exp">Experimental</span>');
    expect(section("Spacer")).not.toContain('class="callout"');
  });

  test("examples are highlighted without changing the copied text or leaking markup", () => {
    const code = [
      "// a <b>comment</b>",
      'import { Button } from "ui";',
      "const n: Array<string> = [1 < 2];",
      '<Button variant="solid" onClick={() => go(`x`)}>Save</Button>',
      '<img alt="</code><script>alert(1)</script>" />',
    ].join("\n");
    const html = renderWith([{ ...components[0]!, examples: [{ code }] }]);
    const block = /<pre><code>([\s\S]*?)<\/code><\/pre>/.exec(html)![1]!;
    const text = block
      .replace(/<\/?span[^>]*>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");

    expect(text).toBe(code);
    expect(block).toContain('<span class="tk-comment">// a &lt;b&gt;comment&lt;/b&gt;</span>');
    expect(block).toContain('<span class="tk-keyword">import</span>');
    expect(block).toContain('<span class="tk-string">"ui"</span>');
    expect(block).toContain('<span class="tk-attr">variant</span>=');
    expect(block).toContain('<span class="tk-fn">go</span>');
    expect(block).toContain("Array&lt;string&gt;");
    expect(block).not.toContain('class="tk-tag">string');
    expect(block).not.toContain("<script>");
  });

  test("@link shows as an external tag", () => {
    const html = renderWith([
      {
        ...components[0]!,
        externalLinks: [
          { title: "Figma <v2>", url: "https://figma.com/docs/button?a=1&b=2" },
          { url: "https://example.com/button" },
        ],
      },
    ]);

    expect(html).toContain(
      '<a class="tag" href="https://figma.com/docs/button?a=1&amp;b=2" target="_blank" rel="noopener noreferrer">Figma &lt;v2&gt; ↗</a>',
    );
    expect(html).toContain('href="https://example.com/button" target="_blank"');
    expect(html).toContain(">https://example.com/button ↗</a>");
  });

  test("gitBaseUrl adds a Source code link", () => {
    const render = (gitBaseUrl?: string) =>
      renderCtx({ ...withComponents, components: [components[0]!] }, { gitBaseUrl });
    const { sourceFilePath, line } = components[0]!;

    expect(render()).not.toContain("Source code");
    expect(render("https://github.com/acme/ui/blob/main/")).toContain(
      `<a class="tag" href="https://github.com/acme/ui/blob/main/${sourceFilePath}#L${line}" target="_blank" rel="noopener noreferrer">Source code ↗</a>`,
    );
  });

  test("a page reads description, badges, links, usage, examples, props; {@link}s are not links", () => {
    const html = renderWith([
      {
        ...components[0]!,
        description: "A button.",
        experimental: true,
        externalLinks: [{ title: "Figma", url: "https://figma.com/b" }],
        links: ["Link", "Variant"],
        usage: "Use for actions.",
        examples: [{ code: "<Button />" }],
      },
      { ...components[1]!, experimental: true },
      { ...components[2]!, links: ["Button"] },
    ]);
    const section = (name: string) => {
      const start = html.indexOf(`<section class="group" id="c-${name}"`);
      return html.slice(start, html.indexOf("</section>", start));
    };

    const button = section("Button");
    const at = (needle: string) => button.indexOf(needle);
    const order = [
      'class="breadcrumb"',
      'class="title"',
      '<p class="lead">A button.</p>',
      'class="capsule exp"',
      "Figma ↗",
      "<h4>Usage</h4>",
      "<h4>Examples</h4>",
      "<h4>Props</h4>",
      'class="props"',
    ].map(at);
    expect(order.every((index) => index >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((x, y) => x - y));
    // Badges and links share one row, grouped with the title and description.
    expect(button.match(/class="tags"/g)).toHaveLength(1);
    expect(button).toMatch(/<div class="comp-intro">[\s\S]*class="title"[\s\S]*class="tags"/);
    expect(button).not.toContain("Variant");
    expect(button).not.toContain('data-goto="c-Link"');
    expect(button).not.toContain("examples</a>");
    expect(section("Accordion")).toContain('<span class="capsule exp">Experimental</span>');
    expect(section("Spacer")).toContain('<span class="capsule">Deprecated</span>');
    // The sidebar flags them compactly.
    expect(html).toContain('Accordion<span class="mini">experimental</span>');
    expect(html).toContain('Spacer<span class="mini">deprecated</span>');
  });

  test("each component is a page of its own, listed on an overview", () => {
    const html = renderWith(components);

    expect(html).toContain('<div class="group" id="components-overview" data-page>');
    for (const name of ["Button", "Accordion", "Spacer"]) {
      expect(html).toContain(`<section class="group" id="c-${name}" data-page`);
      expect(html).toContain(`<a class="comp-card" href="#c-${name}" data-goto="c-${name}">`);
    }
    // The pages link back to the overview.
    expect(html).toContain('<a class="crumb" href="#components-overview"');
  });

  test("examples are tabs with a copy button each", () => {
    const html = renderWith([
      {
        ...components[0]!,
        examples: [{ title: "Basic", code: "<Button />" }, { code: "<Button disabled />" }],
      },
    ]);

    expect(html).toContain('data-ex-tab="0" aria-selected="true">Basic</button>');
    expect(html).toContain('data-ex-tab="1" aria-selected="false">Example 2</button>');
    expect(html).toContain('data-ex-panel="0">');
    expect(html).toContain('data-ex-panel="1" hidden>');
    expect(html.match(/class="copy" data-copy/g)).toHaveLength(2);
    expect(html).toContain(
      '<pre><code>&lt;<span class="tk-tag">Button</span> disabled /&gt;</code></pre>',
    );
  });

  test("the sidebars have a toggle for the collapsible table of contents on mobile", () => {
    const html = renderWith(components);

    expect(html.match(/<button type="button" class="side-toggle"/g)).toHaveLength(2);
  });

  test("every component is searchable, with its category and tags", () => {
    const html = renderWith([
      { ...components[0]!, category: "Actions" },
      { ...components[2]!, experimental: true },
    ]);

    expect(html).toContain(
      '<section class="group" id="c-Button" data-page data-search="Button Actions" data-kind="component" data-name="Button" data-meta="Actions" hidden>',
    );
    expect(html).toContain(
      'data-search="Spacer Experimental Deprecated" data-kind="component" data-name="Spacer" data-meta="Experimental · Deprecated"',
    );
  });

  test("output depends on sources and config only: no footer, no repository state", () => {
    const html = renderWith(components);

    expect(html).not.toContain("Generated from");
    expect(html).not.toContain('class="foot"');
  });

  test("component text is escaped", () => {
    const html = renderWith([{ ...components[0]!, description: "<script>alert(1)</script>" }]);

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    // Only ours: the pre-paint mode init and the page script.
    expect(html.match(/<script>/g)).toHaveLength(2);
  });
});
