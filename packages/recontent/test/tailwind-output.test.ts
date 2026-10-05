import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "@jest/globals";
import type { PluginContext } from "@recontentapp/core";
import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "../src/index.js";
import { generateTailwindFiles, tailwind } from "../src/plugins/tailwind.js";

function build() {
  const ref = defineReferenceTokens({
    color: { primary: tokens.color("#0ea5e9"), dark: tokens.color("#18181b") },
    fontFamily: { body: tokens.fontFamily("Arial") },
    spacing: tokens.dimensionScale({ sm: "4px", md: "8px" }),
  });
  const system = defineSystemTokens({
    colors: {
      accent: ref.color.primary,
      textMuted: tokens.color("#666666"),
      nested: { deep: tokens.color("#123456") },
    },
    spacing: tokens.dimensionScale({ sm: "4px", md: "8px" }),
    radius: tokens.dimensionScale({ full: "9999px" }),
    fontFamily: ref.fontFamily.body,
    shadow: {
      card: tokens.shadow({
        color: ref.color.primary,
        offsetX: "0px",
        offsetY: "2px",
        blur: "4px",
        spread: "0px",
      }),
    },
    typography: {
      heading: tokens.typography({
        fontFamily: ref.fontFamily.body,
        fontSize: "24px",
        fontWeight: "bold",
      }),
    },
  });
  const dark = defineTheme(system, { colors: { accent: tokens.color("#111111") } });
  const config = defineConfig({
    tokens: { ref, system, components: {} },
    themes: { dark },
  });
  return { ref, system, config };
}

function ctxOf(config: ReturnType<typeof build>["config"]): PluginContext {
  return {
    registry: config.registry,
    themes: config.themes,
    root: "/project",
    logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
    mode: "build",
  };
}

function render(
  options: Partial<Parameters<typeof generateTailwindFiles>[1]>,
  fixture = build(),
): string {
  return generateTailwindFiles(fixture.config, { outDir: "out", ...options })[0]!.content;
}

function themeBlock(css: string): string {
  return /@theme inline \{[^}]*\}/.exec(css)![0];
}

describe("theme mapping", () => {
  test("a color group maps kebab-cased keys and nested groups to --color-*", () => {
    const { system } = build();
    const css = render({ theme: { color: system.colors } });
    const block = themeBlock(css);
    expect(block).toContain("--color-accent: var(--system-colors-accent);");
    expect(block).toContain("--color-text-muted: var(--system-colors-textMuted);");
    expect(block).toContain("--color-nested-deep: var(--system-colors-nested-deep);");
  });

  test("scales, ad-hoc objects and a bare spacing token", () => {
    const { system } = build();
    const css = render({
      theme: {
        spacing: system.spacing,
        radius: system.radius,
        font: { sans: system.fontFamily },
      },
    });
    const block = themeBlock(css);
    expect(block).toContain("--spacing-md: var(--system-spacing-md);");
    expect(block).toContain("--radius-full: var(--system-radius-full);");
    expect(block).toContain("--font-sans: var(--system-fontFamily);");

    const bare = render({ theme: { spacing: system.spacing.sm } });
    expect(themeBlock(bare)).toContain("--spacing: var(--system-spacing-sm);");
  });

  test("a bare token for a non-spacing namespace is an error", () => {
    const { system } = build();
    expect(() => render({ theme: { color: system.colors.accent } })).toThrow(/bare token/);
  });

  test("only the passed tokens appear in @theme", () => {
    const { system } = build();
    const css = render({ theme: { color: { accent: system.colors.accent } } });
    const block = themeBlock(css);
    expect(block).not.toContain("text-muted");
    expect(block).not.toContain("spacing");
    expect(css).toContain("--system-colors-textMuted: #666666;");
    expect(css).toContain("--ref-color-primary: #0ea5e9;");
  });

  test("omits @theme when no theme tokens are passed", () => {
    expect(render({})).not.toContain("@theme");
  });

  test("resetDefaults emits initial resets", () => {
    const { system } = build();
    const css = render({ theme: { color: system.colors }, resetDefaults: true });
    expect(css).toContain("@theme {\n  --color-*: initial;\n}");
    const listed = render({
      theme: { color: system.colors, spacing: system.spacing },
      resetDefaults: ["spacing"],
    });
    expect(listed).toContain("--spacing-*: initial;");
    expect(listed).not.toContain("--color-*: initial;");
  });

  test('resetDefaults: "all" emits --*: initial', () => {
    const { system } = build();
    const css = render({ theme: { color: system.colors }, resetDefaults: "all" });
    expect(css).toContain("@theme {\n  --*: initial;\n}");
  });

  test("typography maps to --text-* sub-properties plus a font-family utility", () => {
    const { system } = build();
    const css = render({ theme: { text: system.typography } });
    const block = themeBlock(css);
    expect(block).toContain("--text-heading: var(--system-typography-heading-font-size);");
    expect(block).toContain(
      "--text-heading--line-height: var(--system-typography-heading-line-height);",
    );
    expect(block).toContain(
      "--text-heading--letter-spacing: var(--system-typography-heading-letter-spacing);",
    );
    expect(block).toContain(
      "--text-heading--font-weight: var(--system-typography-heading-font-weight);",
    );
    expect(css).toContain(
      "@utility text-heading {\n  font-family: var(--system-typography-heading-font-family);\n}",
    );
  });

  test("shadow namespaces", () => {
    const { system } = build();
    const css = render({
      theme: {
        shadow: system.shadow,
        insetShadow: { inset: system.shadow.card },
        dropShadow: { drop: system.shadow.card },
        textShadow: { text: system.shadow.card },
      },
    });
    const block = themeBlock(css);
    expect(block).toContain("--shadow-card: var(--system-shadow-card);");
    expect(block).toContain("--inset-shadow-inset: var(--system-shadow-card);");
    expect(block).toContain("--drop-shadow-drop: var(--system-shadow-card);");
    expect(block).toContain("--text-shadow-text: var(--system-shadow-card);");
    expect(css).not.toContain("@utility");
  });

  test("perspective and aspect namespaces", () => {
    const ref = defineReferenceTokens({ perspective: { near: tokens.dimension("400px") } });
    const system = defineSystemTokens({ ratio: { wide: tokens.number(1.78) } });
    const config = defineConfig({ tokens: { ref, system, components: {} } });
    const css = render({ theme: { perspective: ref.perspective, aspect: system.ratio } }, {
      ref,
      system,
      config,
    } as never);
    const block = themeBlock(css);
    expect(block).toContain("--perspective-near: var(--ref-perspective-near);");
    expect(block).toContain("--aspect-wide: var(--system-ratio-wide);");
  });
});

describe("themes", () => {
  test(".dark by default with a matching @custom-variant", () => {
    const css = render({});
    expect(css).toContain(".dark {");
    expect(css).toContain("@custom-variant dark (&:where(.dark, .dark *));");
  });

  test("theme blocks follow every :root block so they win the cascade on <html>", () => {
    const css = render({});
    expect(css.lastIndexOf(".dark {")).toBeGreaterThan(css.lastIndexOf(":root {"));
  });

  test("attribute mode", () => {
    const css = render({ themeSelector: "attribute" });
    expect(css).toContain('[data-theme="dark"] {');
    expect(css).toContain(
      '@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));',
    );
  });

  test("themeVariants: false omits the variants", () => {
    expect(render({ themeVariants: false })).not.toContain("@custom-variant");
  });

  test("a variant is emitted for every theme, kebab-cased", () => {
    const fixture = build();
    const highContrast = defineTheme(fixture.system, {
      colors: { accent: tokens.color("#000000") },
    });
    const config = defineConfig({
      tokens: { ref: fixture.ref, system: fixture.system, components: {} },
      themes: { dark: fixture.config.themes.dark!, highContrast },
    });
    const css = render({}, { ...fixture, config });
    expect(css).toContain("@custom-variant dark (&:where(.dark, .dark *));");
    expect(css).toContain(
      "@custom-variant high-contrast (&:where(.highContrast, .highContrast *));",
    );

    const listed = render({ themeVariants: ["highContrast"] }, { ...fixture, config });
    expect(listed).not.toContain("@custom-variant dark");
    expect(listed).toContain("@custom-variant high-contrast");
  });
});

describe("validate()", () => {
  function diagnose(options: Partial<Parameters<typeof tailwind>[0]>, fixture = build()) {
    return tailwind({ outDir: "out", ...options }).validate!(ctxOf(fixture.config)) as ReturnType<
      NonNullable<ReturnType<typeof tailwind>["validate"]>
    > &
      unknown[];
  }

  test("clean config has no diagnostics", () => {
    const { system } = build();
    expect(diagnose({ theme: { color: system.colors } })).toEqual([]);
  });

  test("wrong $type", () => {
    const { system } = build();
    const result = diagnose({ theme: { color: { x: system.spacing.sm } as never } });
    expect(result).toHaveLength(1);
    expect(JSON.stringify(result)).toMatch(/expected a color token, got dimension/);
  });

  test("unregistered token", () => {
    const stray = defineSystemTokens({ colors: { stray: tokens.color("#ffffff") } });
    const result = diagnose({ theme: { color: stray.colors } });
    expect(JSON.stringify(result)).toMatch(/not registered/);
  });

  test("duplicate keys", () => {
    const { system } = build();
    const result = diagnose({
      theme: { color: { textMuted: system.colors.textMuted, "text-muted": system.colors.accent } },
    });
    expect(JSON.stringify(result)).toMatch(/--color-text-muted is produced by both/);
  });

  test("spacing keys that shadow container sizes warn instead of failing", () => {
    const { system } = build();
    const result = diagnose({ theme: { spacing: system.spacing } });
    expect(result).toHaveLength(2);
    expect(JSON.stringify(result)).not.toMatch(/"severity":"error"/);
    expect(JSON.stringify(result)).toMatch(/--spacing-md also overrides the container size/);
    expect(() => render({ theme: { spacing: system.spacing } })).not.toThrow();
  });

  test("text-<k> vs --color-<k> collision", () => {
    const ref = defineReferenceTokens({ fontFamily: { body: tokens.fontFamily("Arial") } });
    const system = defineSystemTokens({
      colors: { heading: tokens.color("#000000") },
      typography: {
        heading: tokens.typography({
          fontFamily: ref.fontFamily.body,
          fontSize: "16px",
          fontWeight: "regular",
        }),
      },
    });
    const config = defineConfig({ tokens: { ref, system, components: {} } });
    const result = diagnose({ theme: { color: system.colors, text: system.typography } }, {
      ref,
      system,
      config,
    } as never);
    expect(JSON.stringify(result)).toMatch(/text-heading clashes with Tailwind's --color-heading/);
  });
});

describe("real Tailwind compile", () => {
  test("utilities and the dark variant resolve against the generated stylesheet", async () => {
    const { compile } = await import("@tailwindcss/node");
    const { system } = build();
    const dir = await fs.mkdtemp(path.join(process.cwd(), "node_modules", ".recontent-tailwind-"));
    try {
      await fs.writeFile(
        path.join(dir, "tailwind.css"),
        render({
          theme: {
            color: system.colors,
            spacing: system.spacing,
            radius: system.radius,
            text: system.typography,
            shadow: system.shadow,
          },
        }),
      );
      const source = '@import "tailwindcss";\n@import "./tailwind.css";';
      const compiler = await compile(source, {
        base: dir,
        onDependency: () => {},
      });
      const out = compiler.build([
        "bg-accent",
        "p-md",
        "rounded-full",
        "text-heading",
        "text-heading/7",
        "leading-tight",
        "tracking-tight",
        "shadow-card",
        "ring-2",
        "dark:bg-accent",
      ]);
      expect(out).toContain("background-color: var(--system-colors-accent)");
      expect(out).toContain("var(--system-spacing-md)");
      expect(out).toContain("var(--system-radius-full)");
      expect(out).toContain("font-size: var(--system-typography-heading-font-size)");
      expect(out).toContain("--tw-leading: var(--leading-tight)");
      expect(out).toContain("--tw-tracking: var(--tracking-tight)");
      expect(out).toMatch(/\.ring-2 \{[^}]*var\(--tw-ring-shadow\), var\(--tw-shadow\)/);
      expect(out).toContain("var(--tw-leading, var(--system-typography-heading-line-height))");
      expect(out).toContain("font-family: var(--system-typography-heading-font-family)");
      expect(out).toContain("--tw-shadow: var(--system-shadow-card)");
      expect(out).toMatch(/:where\(\.dark, \.dark \*\)/);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
