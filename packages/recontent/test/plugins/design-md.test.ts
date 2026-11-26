import { describe, expect, test } from "@jest/globals";
import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "../../src/index.js";
import { generateDesignMdFiles } from "../../src/plugins/design-md.js";
import type { ComponentInfo } from "../../src/introspection/model.js";
import type { PluginContext } from "../../src/plugins/types.js";
import { goldenConfig } from "../helpers/fixtures.js";

function ctxFor(config: ReturnType<typeof goldenConfig>["config"]): PluginContext {
  return {
    registry: config.registry,
    groups: config.groups,
    themes: config.themes,
    root: "/project",
    logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
  };
}

function render(
  ctx: PluginContext,
  options: Partial<Parameters<typeof generateDesignMdFiles>[1]> = {},
): string {
  const files = generateDesignMdFiles(ctx, { outDir: "docs", ...options });
  expect(files.map((file) => file.filename)).toEqual(["DESIGN.md"]);
  return files[0]!.content;
}

const renderConfig = (config: ReturnType<typeof goldenConfig>["config"]) => render(ctxFor(config));

const frontMatterOf = (md: string) => md.slice(0, md.indexOf("\n---\n", 4) + 5);

describe("DESIGN.md front matter", () => {
  const md = renderConfig(goldenConfig().config);
  const frontMatter = frontMatterOf(md);

  test("starts with the version and the name", () => {
    expect(frontMatter).toMatch(/^---\nversion: alpha\nname: "Design system"\n/);
    expect(md).toContain("\n# Design system\n");
  });

  test("groups tokens by type and keys them with the CSS variable name", () => {
    expect(frontMatter).toContain('colors:\n  ref-color-black: "#000000"');
    expect(frontMatter).toContain('  ref-palette-100: "#111111"');
    expect(frontMatter).toContain("typography:\n  system-typography-body: {");
    expect(frontMatter).toContain('fontFamily: "Arial", fontSize: "16px", fontWeight: 400');
    expect(frontMatter).toContain('spacing:\n  ref-spacing-0: "0px"');
  });

  test("an alias to a token of the front matter is a reference", () => {
    expect(frontMatter).toContain('  system-colors-accent: "{colors.ref-color-black}"');
    expect(frontMatter).toContain('  system-colors-surface: "{colors.ref-color-white}"');
  });

  test("tokens with no group of their own stay out, and so do theme values", () => {
    expect(frontMatter).not.toContain("system-shadow-elevated");
    expect(frontMatter).not.toContain("ref-motion");
    expect(frontMatter).not.toContain("#eeeeee");
    expect(frontMatter).not.toContain("rounded:");
  });

  test("component tokens are grouped by component, and resolve what the front matter lacks", () => {
    expect(frontMatter).toContain(
      'components:\n  button:\n    background: "{colors.system-colors-accent}"\n    border: "1px solid var(--ref-color-black)"\n',
    );
  });

  test("dimensions are split between rounded and spacing by their path", () => {
    const ref = defineReferenceTokens({
      radius: { md: tokens.dimension("6px") },
      gap: { sm: tokens.dimension("4px") },
      size: { icon: tokens.dimension("16px") },
    });
    const md = renderConfig(
      defineConfig({ tokens: { ref, system: defineSystemTokens({}), components: {} } }),
    );
    expect(frontMatterOf(md)).toContain('rounded:\n  ref-radius-md: "6px"');
    expect(frontMatterOf(md)).toContain('spacing:\n  ref-gap-sm: "4px"');
    expect(frontMatterOf(md)).not.toContain("ref-size-icon");
    expect(md).toContain("## Layout\n\n- `ref-size-icon`: `16px`");
  });

  test("keys that aren't plain identifiers are quoted", () => {
    const ref = defineReferenceTokens({ "a b": { c: tokens.color("#000000") } });
    const md = renderConfig(
      defineConfig({ tokens: { ref, system: defineSystemTokens({}), components: {} } }),
    );
    expect(frontMatterOf(md)).toContain('  "ref-a b-c": "#000000"');
  });
});

describe("DESIGN.md prose", () => {
  const md = renderConfig(goldenConfig().config);

  test("sections come in the order of the spec, and only when they have content", () => {
    const headings = [...md.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
    expect(headings).toEqual([
      "Overview",
      "Colors",
      "Typography",
      "Elevation & Depth",
      "Shapes",
      "Themes",
      "Do's and Don'ts",
    ]);
  });

  test("the overview explains how keys map to paths and CSS variables", () => {
    expect(md).toContain(
      "`system-border-default` is `system.border.default` (`--system-border-default`)",
    );
  });

  test("descriptions are written, tokens missing from the front matter come with their value", () => {
    expect(md).toContain("- `system-colors-accent`: Primary accent color.");
    expect(md).toContain("- `system-gradient-accent`: `linear-gradient(90deg, ");
    expect(md).toContain("- `ref-fontFamily-body`: `Arial`");
    expect(md).toContain("- `ref-weight-brand`: `500`");
    expect(md).toContain("inset 0px 2px 4px 0px var(--ref-color-black), 0px 1px 2px 0px #111111");
    expect(md).toContain("- `system-border-default`: `1px solid var(--ref-color-black)`");
  });

  test("motion tokens have no section", () => {
    expect(md).not.toContain("ref-motion");
    expect(md).not.toContain("system-transition");
  });

  test("themes list the tokens they override", () => {
    expect(md).toContain("| Token | default | dark | highContrast |");
    expect(md).toContain("| `system-colors-accent` | `#000000` | `#eeeeee` | `#ff0000` |");
  });

  test("themes have their own section, which also holds overrides that are not colors", () => {
    const ref = defineReferenceTokens({
      color: { black: tokens.color("#000000") },
      space: { md: tokens.dimension("16px") },
    });
    const compact = defineTheme(ref, { space: { md: tokens.dimension("12px") } });
    const sections = renderConfig(
      defineConfig({
        tokens: { ref, system: defineSystemTokens({}), components: {} },
        themes: { compact },
      }),
    ).split(/^## /m);

    const themes = sections.find((section) => section.startsWith("Themes"));
    expect(themes).toContain("| `ref-space-md` | `16px` | `12px` |");
  });

  test("themes are left out when none overrides a token", () => {
    const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
    const md = renderConfig(
      defineConfig({ tokens: { ref, system: defineSystemTokens({}), components: {} } }),
    );
    expect(md).not.toContain("| Token |");
  });

  test("deprecations are listed as things not to use", () => {
    expect(md).toContain(
      "- Don't use `{components.button.background}`: Use system.colors.surface instead.",
    );
  });

  test("scale descriptions and deprecations are written once", () => {
    const ref = defineReferenceTokens({
      palette: tokens
        .colorScale({ 100: "#111111", 200: "#222222" })
        .describe("Brand <b>palette</b>")
        .deprecate("Use other"),
    });
    const md = renderConfig(
      defineConfig({ tokens: { ref, system: defineSystemTokens({}), components: {} } }),
    );
    expect(md.match(/^- `ref-palette`: /gm)).toHaveLength(1);
    expect(md).toContain("- `ref-palette`: Brand \\<b\\>palette\\</b\\>");
    expect(md).toContain("- Don't use `ref-palette`: Use other");
  });

  test("group descriptions and deprecations are written once", () => {
    const ref = defineReferenceTokens({
      color: tokens
        .group({ black: tokens.color("#000000"), white: tokens.color("#ffffff") })
        .describe("Base colors")
        .deprecate("Use other"),
    });
    const md = renderConfig(
      defineConfig({ tokens: { ref, system: defineSystemTokens({}), components: {} } }),
    );
    expect(md.match(/^- `ref-color`: /gm)).toHaveLength(1);
    expect(md).toContain("- `ref-color`: Base colors");
    expect(md).toContain("- Don't use `ref-color`: Use other");
  });

  test("token descriptions are escaped", () => {
    const ref = defineReferenceTokens({
      color: { a: tokens.color("#000000").describe("one | two\nthree *x*") },
    });
    const md = renderConfig(
      defineConfig({ tokens: { ref, system: defineSystemTokens({}), components: {} } }),
    );
    expect(md).toContain("- `ref-color-a`: one \\| two three \\*x\\*");
  });
});

describe("options", () => {
  const ctx = ctxFor(goldenConfig().config);

  test("title and description go to the front matter and the document", () => {
    const md = render(ctx, { title: 'Acme "UI"', description: "Calm, dense UI." });
    expect(md).toContain('name: "Acme \\"UI\\""\ndescription: "Calm, dense UI."\n');
    expect(md).toContain('# Acme "UI"\n');
    expect(md).toContain("## Overview\n\nCalm, dense UI.\n\nKeys mirror");
  });

  test("the title is escaped in the heading", () => {
    expect(render(ctx, { title: "a*b" })).toContain("# a\\*b\n");
  });

  test("dos and donts come before the deprecations", () => {
    const md = render(ctx, { dos: ["use system tokens"], donts: ["hardcode colors"] });
    expect(md).toContain(
      "## Do's and Don'ts\n\n- Do use system tokens\n- Don't hardcode colors\n- Don't use `{components.button.background}`",
    );
  });

  test("a config without themes or descriptions has no table and no description", () => {
    const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
    const md = renderConfig(
      defineConfig({ tokens: { ref, system: defineSystemTokens({}), components: {} } }),
    );
    expect(md).not.toContain("description:");
    expect(md).not.toContain("Do's and Don'ts");
  });
});

describe("components", () => {
  const components: ComponentInfo[] = [
    {
      name: "Button",
      sourceFilePath: "src/button.tsx",
      line: 12,
      description: "Triggers an action.\n\nSecond paragraph.",
      props: [],
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
      replacement: "Button",
      props: [],
      inherits: [],
      references: [],
    },
    {
      name: "Row",
      sourceFilePath: "src/row.tsx",
      line: 1,
      deprecated: "Use `Stack`.",
      props: [],
      inherits: [],
      references: [],
    },
  ];
  const withComponents = { ...ctxFor(goldenConfig().config), components };

  test("each component has one line, and the full API is one command away", () => {
    const md = render(withComponents);
    expect(md).toContain(
      "## Components\n\n- **Button**: Triggers an action.\n- **Accordion**\n\nRun `recontent inspect components <Name>` for props, usage and examples.",
    );
    expect(md).not.toContain("Second paragraph");
    expect(md).not.toContain("Source:");
  });

  test("deprecated components are things not to use", () => {
    const md = render(withComponents);
    expect(md).not.toContain("- **Spacer**");
    expect(md).toContain("- Don't use `Spacer`: Use `Button`.");
    expect(md).toContain("- Don't use `Row`: Use \\`Stack\\`.");
  });

  test("nothing is added when the context has no components", () => {
    expect(render(ctxFor(goldenConfig().config))).not.toContain("## Components\n");
  });

  const detailed: ComponentInfo[] = [
    {
      name: "Dialog",
      sourceFilePath: "src/dialog.tsx",
      line: 1,
      description: "Modal window.",
      category: "Overlays",
      experimental: true,
      props: [
        { name: "open", type: "boolean", required: false },
        { name: "modal", type: "boolean", required: false, deprecated: "Always modal." },
        { name: "legacy", type: "boolean", required: false, deprecated: true },
      ],
      inherits: [],
      references: [],
    },
    {
      name: "Button",
      sourceFilePath: "src/button.tsx",
      line: 1,
      category: "Actions",
      props: [],
      inherits: [],
      references: [],
    },
    {
      name: "Stack",
      sourceFilePath: "src/stack.tsx",
      line: 1,
      props: [],
      inherits: [],
      references: [],
    },
  ];
  const detailedCtx = { ...ctxFor(goldenConfig().config), components: detailed };

  test("categories become headings, uncategorized components come last, and experimental ones say so", () => {
    expect(render(detailedCtx)).toContain(
      "## Components\n\n### Actions\n\n- **Button**\n\n### Overlays\n\n- **Dialog** (experimental): Modal window.\n\n- **Stack**\n\nRun",
    );
  });

  test("deprecated props of active components are things not to use", () => {
    const md = render(detailedCtx);
    expect(md).toContain("- Don't use `Dialog` prop `modal`: Always modal.");
    expect(md).toContain("- Don't use `Dialog` prop `legacy`.");
    expect(md).not.toContain("prop `open`");
  });
});

describe("agent discovery", () => {
  const ctx = ctxFor(goldenConfig().config);
  const query = (from = "") =>
    `Query tokens, props and types on demand with \`recontent inspect${from}\` (or over MCP with \`recontent mcp${from}\`).`;

  test("the overview points to the commands, with --from for a published package", () => {
    expect(render(ctx)).toContain(query());
    expect(render(ctx, { packageName: "@acme/ds" })).toContain(query(" --from @acme/ds"));
  });

  test("the components command follows the package name", () => {
    const withComponents = {
      ...ctx,
      components: [
        {
          name: "Button",
          sourceFilePath: "src/button.tsx",
          line: 1,
          props: [],
          inherits: [],
          references: [],
        },
      ],
    };
    expect(render(withComponents, { packageName: "@acme/ds" })).toContain(
      "Run `recontent inspect components <Name> --from @acme/ds` for props",
    );
  });

  test("a config with components only still has an overview", () => {
    const ref = defineReferenceTokens({});
    const empty = ctxFor(
      defineConfig({ tokens: { ref, system: defineSystemTokens({}), components: {} } }),
    );
    const components = [
      {
        name: "Button",
        sourceFilePath: "src/button.tsx",
        line: 1,
        props: [],
        inherits: [],
        references: [],
      },
    ];
    expect(render({ ...empty, components })).toContain(`## Overview\n\n${query()}`);
  });
});
