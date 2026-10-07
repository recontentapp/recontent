import { describe, expect, test } from "@jest/globals";
import { defineConfig, defineReferenceTokens, defineSystemTokens, tokens } from "../src/index.js";
import { generateDocsFiles } from "../src/plugins/docs/index.js";
import type { PluginContext } from "@recontentapp/core";
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
    expect(values.default).toBe("#000000");
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
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).toContain("Scale &lt;b&gt;desc&lt;/b&gt;");
    expect(html).toContain("Use &lt;i&gt;other&lt;/i&gt;");
  });

  test("descriptions cannot break out of the embedded stylesheet", () => {
    expect(html.match(/<\/style>/g)).toHaveLength(2);
  });

  test("renders scale metadata in markdown", () => {
    expect(md).toContain("Scale <b>desc</b>");
    expect(md).toContain("> ⚠️ Deprecated: Use <i>other</i>");
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
