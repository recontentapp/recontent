import { describe, expect, test } from "@jest/globals";
import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "../src/index.js";
import { generateDocsFiles } from "../src/plugins/docs/index.js";
import type { ComponentManifest, GitInfo, PluginContext } from "@recontentapp/core";
import { goldenConfig } from "./helpers/fixtures.js";

function ctxFor(config: ReturnType<typeof goldenConfig>["config"]): PluginContext {
  return {
    registry: config.registry,
    themes: config.themes,
    root: "/project",
    logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
    mode: "build",
  };
}

function render(config: ReturnType<typeof goldenConfig>["config"]) {
  const files = generateDocsFiles(ctxFor(config), { outDir: "docs", markdown: true });
  const byName = Object.fromEntries(files.map((f) => [f.filename, f.content]));
  return { html: byName["design.html"]!, md: byName["design.md"]! };
}

describe("design.html", () => {
  const { html } = render(goldenConfig().config);

  test("has one tab per layer", () => {
    for (const layer of ["ref", "system", "components"]) {
      expect(html).toContain(`data-tab="${layer}"`);
      expect(html).toContain(`data-panel="${layer}"`);
    }
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

  test("omits the theme picker when there are no themes", () => {
    const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    const files = generateDocsFiles(ctxFor(config), { outDir: "docs" });
    expect(files[0]!.content).not.toContain('id="theme"');
    expect(files[0]!.content).toContain("No system tokens defined.");
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
  const { html, md } = render(config);

  test("escapes descriptions in HTML", () => {
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).toContain("Scale &lt;b&gt;desc&lt;/b&gt;");
    expect(html).toContain("Use &lt;i&gt;other&lt;/i&gt;");
  });

  test("descriptions cannot break out of the embedded stylesheet", () => {
    expect(html.match(/<\/style>/g)).toHaveLength(2);
  });

  test("renders scale metadata in markdown", () => {
    expect(md).toContain("Scale \\<b\\>desc\\</b\\>");
    expect(md).toContain("> ⚠️ Deprecated: Use \\<i\\>other\\</i\\>");
  });

  test("escapes the title, group labels and theme names in markdown", () => {
    const ref = defineReferenceTokens({
      "a*b": { c: tokens.color("#000000") },
    });
    const dark = defineTheme({ ref }, { ref: { "a*b": { c: tokens.color("#ffffff") } } });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
      themes: { dark_mode: dark },
    });
    const files = generateDocsFiles(ctxFor(config), { outDir: "docs", markdown: true });
    const markdown = files.find((file) => file.filename.endsWith(".md"))!.content;
    expect(markdown).toContain("### ref.a\\*b");
    expect(markdown).toContain("| Token | Type | Value | dark\\_mode | Notes |");
  });
});

describe("design.md", () => {
  test("has layer headings, group headings and theme columns", () => {
    const { md } = render(goldenConfig().config);
    expect(md).toContain("## Reference");
    expect(md).toContain("## System");
    expect(md).toContain("## Components");
    expect(md).toContain("### system.colors");
    expect(md).toContain("| Token | Type | Value | dark | highContrast | Notes |");
    expect(md).toContain("| `system.colors.accent` | color | `#000000` | `#eeeeee` | `#ff0000` |");
    expect(md).toContain("→ `ref.color.black`");
    expect(md).toContain("Primary accent color.");
    expect(md).toContain("**Deprecated**: Use system.colors.surface instead.");
  });

  test("omits theme columns when there are no themes", () => {
    const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    const { md } = render(config);
    expect(md).toContain("| Token | Type | Value | Notes |");
  });

  test("escapes pipes and newlines in cells", () => {
    const ref = defineReferenceTokens({
      color: { a: tokens.color("#000000").describe("one | two\nthree") },
    });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    expect(render(config).md).toContain("one \\| two<br>three");
  });
});

describe("components and git", () => {
  const components: ComponentManifest = {
    schemaVersion: "1",
    warnings: [],
    components: [
      {
        name: "Button",
        sourceFilePath: "src/button.tsx",
        line: 12,
        description: "Triggers an action.",
        history: {
          created: { commit: "a".repeat(40), date: "2024-01-01T10:00:00Z" },
          updated: { commit: "b".repeat(40), date: "2024-03-01T10:00:00Z" },
        },
        props: [
          {
            name: "variant",
            type: "Variant",
            values: ["solid", "outline"],
            required: false,
            defaultValue: '"solid"',
            description: "Visual weight.",
          },
          { name: "label", type: "string", required: true, deprecated: "Use children." },
        ],
        inherits: [{ name: "ButtonHTMLAttributes", package: "@types/react", count: 263 }],
      },
      {
        name: "Spacer",
        sourceFilePath: "src/spacer.tsx",
        line: 1,
        deprecated: true,
        props: [],
        inherits: [],
      },
    ],
  };
  const git: GitInfo = {
    commit: "1234567890abcdef1234567890abcdef12345678",
    branch: "main",
    dirty: true,
    shallow: false,
    root: "ds",
    remote: { url: "git@github.com:acme/ds.git", webUrl: "https://github.com/acme/ds" },
  };
  const withExtras = { ...ctxFor(goldenConfig().config), components, git };

  function renderWith(ctx: PluginContext) {
    const files = generateDocsFiles(ctx, { outDir: "docs", markdown: true });
    const byName = Object.fromEntries(files.map((f) => [f.filename, f.content]));
    return { html: byName["design.html"]!, md: byName["design.md"]! };
  }

  test("markdown gets a props table, an inherited-props line, a source link and a footer", () => {
    const { md } = renderWith(withExtras);

    expect(md).toContain("## Component APIs");
    expect(md).toContain("### Button");
    expect(md).toContain("Triggers an action.");
    expect(md).toContain(
      "Source: [`src/button.tsx:12`](https://github.com/acme/ds/blob/1234567890abcdef1234567890abcdef12345678/ds/src/button.tsx#L12) · Updated 2024-03-01",
    );
    expect(md).toContain(
      '| `variant` | `"solid" \\| "outline"` | `"solid"` | no | Visual weight. |',
    );
    expect(md).toContain("| `label` | `string` | — | yes | **Deprecated**: Use children. |");
    expect(md).toContain("Also accepts: `ButtonHTMLAttributes` (263 props from @types/react)");
    expect(md).toContain("> ⚠️ Deprecated");
    expect(md).toContain("_Generated from 1234567 on main (uncommitted changes)_");
  });

  test("html gets a Component APIs tab, a source link and a footer", () => {
    const { html } = renderWith(withExtras);

    expect(html).toContain('data-tab="api"');
    expect(html).toContain('data-panel="api"');
    expect(html).toContain('id="c-Button"');
    expect(html).toContain(
      'href="https://github.com/acme/ds/blob/1234567890abcdef1234567890abcdef12345678/ds/src/button.tsx#L12"',
    );
    expect(html).toContain("Generated from 1234567 on main (uncommitted changes)");
  });

  test("without a web remote the source is plain text; without history there is no date", () => {
    const { md } = renderWith({
      ...withExtras,
      git: { ...git, remote: undefined },
      components: {
        ...components,
        components: [{ ...components.components[0]!, history: undefined }],
      },
    });

    expect(md).toContain("Source: `src/button.tsx:12`\n");
    expect(md).not.toContain("Updated");
  });

  test("nothing is added when the context has no components or git", () => {
    const plain = renderWith(ctxFor(goldenConfig().config));

    expect(plain.md).not.toContain("Component APIs");
    expect(plain.md).not.toContain("Generated from");
    expect(plain.html).not.toContain('data-tab="api"');
    expect(plain.html).not.toContain("Generated from");
  });

  test("component text is escaped in html", () => {
    const { html } = renderWith({
      ...withExtras,
      components: {
        ...components,
        components: [{ ...components.components[0]!, description: "<script>alert(1)</script>" }],
      },
    });

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
