import { describe, expect, test } from "@jest/globals";
import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "../src/index.js";
import { generateDesignMdFiles } from "../src/plugins/design-md.js";
import type { ComponentInfo, PluginContext } from "@recontentapp/core";
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

function render(ctx: PluginContext, options: { title?: string } = {}): string {
  const files = generateDesignMdFiles(ctx, { outDir: "docs", ...options });
  expect(files.map((file) => file.filename)).toEqual(["DESIGN.md"]);
  return files[0]!.content;
}

const renderConfig = (config: ReturnType<typeof goldenConfig>["config"]) => render(ctxFor(config));

describe("DESIGN.md", () => {
  test("has layer headings, group headings and theme columns", () => {
    const md = renderConfig(goldenConfig().config);
    expect(md).toContain("# Design system");
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

  test("uses the title option", () => {
    expect(render(ctxFor(goldenConfig().config), { title: "Acme" })).toContain("# Acme\n");
  });

  test("omits theme columns when there are no themes", () => {
    const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    expect(renderConfig(config)).toContain("| Token | Type | Value | Notes |");
  });

  test("escapes pipes and newlines in cells", () => {
    const ref = defineReferenceTokens({
      color: { a: tokens.color("#000000").describe("one | two\nthree") },
    });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    expect(renderConfig(config)).toContain("one \\| two<br>three");
  });

  test("renders scale metadata", () => {
    const ref = defineReferenceTokens({
      palette: tokens
        .colorScale({ 100: "#111111" })
        .describe("Scale <b>desc</b>")
        .deprecate("Use <i>other</i>"),
    });
    const md = renderConfig(
      defineConfig({ tokens: { ref, system: defineSystemTokens({}), components: {} } }),
    );
    expect(md).toContain("Scale \\<b\\>desc\\</b\\>");
    expect(md).toContain("> ⚠️ Deprecated: Use \\<i\\>other\\</i\\>");
  });

  test("escapes the title, group labels and theme names", () => {
    const ref = defineReferenceTokens({
      "a*b": { c: tokens.color("#000000") },
    });
    const dark = defineTheme({ ref }, { ref: { "a*b": { c: tokens.color("#ffffff") } } });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
      themes: { dark_mode: dark },
    });
    const markdown = renderConfig(config);
    expect(markdown).toContain("### ref.a\\*b");
    expect(markdown).toContain("| Token | Type | Value | dark\\_mode | Notes |");
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
          description: "Visual weight.",
        },
        { name: "label", type: "string", required: true, deprecated: "Use children." },
        {
          name: "width",
          type: "Width",
          resolved: 'number | "auto"',
          required: false,
        },
      ],
      inherits: [
        {
          name: "ButtonHTMLAttributes",
          package: "@types/react",
          props: ["aria-label", "onClick", "type"],
        },
      ],
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

  test("gets a props table, an inherited-props line and a plain source line", () => {
    const md = render(withComponents);

    expect(md).toContain("## Component APIs");
    expect(md).toContain("### Button");
    expect(md).toContain("Triggers an action.");
    expect(md).toContain("Source: `src/button.tsx:12` · Updated 2024-03-01");
    expect(md).toContain(
      '| `variant` | `"solid" \\| "outline"` | `"solid"` | no | Visual weight. |',
    );
    expect(md).toContain("| `label` | `string` | — | yes | **Deprecated**: Use children. |");
    expect(md).toContain("Also accepts: `ButtonHTMLAttributes` (3 props from @types/react)");
    expect(md).toContain("> ⚠️ Deprecated");
  });

  test("a resolved alias is shown under the type, and type parameters next to the name", () => {
    const md = render(withComponents);

    expect(md).toContain('| `width` | `Width`<br>`number \\| "auto"` | — | no |  |');
    expect(md).toContain("### Accordion\\<Value extends string\\>");
  });

  test("usage, examples, replacement and experimental notes are written", () => {
    const md = render({
      ...withComponents,
      components: [
        {
          ...components[0]!,
          category: "Actions",
          usage: "Use for <b>primary</b> actions.",
          examples: [
            { title: "Basic", code: "<Button />" },
            { code: "<Button>\n  Save\n</Button>" },
          ],
        },
        {
          ...components[2]!,
          experimental: "Subject to change.",
          deprecated: "Use `Button`.",
          replacement: "Button",
        },
      ],
    });

    expect(md).toContain("#### Usage\n\nUse for <b>primary</b> actions.");
    expect(md).toContain("#### Examples\n\n**Basic**\n\n```tsx\n<Button />\n```");
    expect(md).toContain("```tsx\n<Button>\n  Save\n</Button>\n```");
    expect(md).toContain("Replaced by: `Button`");
    expect(md).toContain("> 🧪 Experimental: Subject to change.");
  });

  test("without lastUpdatedAt there is no date", () => {
    const md = render({
      ...withComponents,
      components: [{ ...components[0]!, lastUpdatedAt: undefined }],
    });

    expect(md).toContain("Source: `src/button.tsx:12`\n");
    expect(md).not.toContain("Updated");
  });

  test("output depends on sources and config only: no footer, no repository state", () => {
    expect(render(withComponents)).not.toContain("Generated from");
  });

  test("nothing is added when the context has no components", () => {
    expect(render(ctxFor(goldenConfig().config))).not.toContain("Component APIs");
  });
});
