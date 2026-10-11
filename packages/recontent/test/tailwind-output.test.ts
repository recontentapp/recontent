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
    motion: { fast: tokens.duration("150ms") },
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

  test("typography maps to --text-* sub-properties plus a native --font-<key>", () => {
    const { system } = build();
    const css = render({ theme: { text: system.typography } });
    const block = themeBlock(css);
    expect(block).toContain("--font-heading: var(--system-typography-heading-font-family);");
    expect(css).not.toContain("@utility");
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
  });

  test("typographyUtilities keeps the text-<key> font-family utility", () => {
    const { system } = build();
    const css = render({ theme: { text: system.typography }, typographyUtilities: true });
    expect(css).toContain(
      "@utility text-heading {\n  font-family: var(--system-typography-heading-font-family);\n}",
    );
    expect(themeBlock(css)).toContain("--font-heading:");
  });

  test("typography clashing with a font key is an error", () => {
    const { system } = build();
    expect(() =>
      render({
        theme: { text: system.typography, font: { heading: system.fontFamily } },
      }),
    ).toThrow(/--font-heading is produced by both/);
  });

  test("an unthemed shadow is inlined in every shadow namespace", () => {
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
    const inlined = "0px 2px 4px 0px var(--ref-color-primary)";
    expect(block).toContain(`--shadow-card: ${inlined};`);
    expect(block).toContain(`--inset-shadow-inset: ${inlined};`);
    expect(block).toContain(`--drop-shadow-drop: ${inlined};`);
    expect(block).toContain(`--text-shadow-text: ${inlined};`);
    expect(css).not.toContain("@utility");
  });

  test("a shadow a theme overrides stays a var() and warns", () => {
    const fixture = build();
    const night = defineTheme(fixture.system, {
      shadow: {
        card: tokens.shadow({
          color: fixture.ref.color.dark,
          offsetX: "0px",
          offsetY: "8px",
          blur: "16px",
          spread: "0px",
        }),
      },
    });
    const config = defineConfig({
      tokens: { ref: fixture.ref, system: fixture.system, components: {} },
      themes: { night },
    });
    const next = { ...fixture, config };
    expect(themeBlock(render({ theme: { shadow: fixture.system.shadow } }, next))).toContain(
      "--shadow-card: var(--system-shadow-card);",
    );
    const result = tailwind({ outDir: "out", theme: { shadow: fixture.system.shadow } }).validate!(
      ctxOf(config),
    ) as { severity: string; message: string }[];
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ severity: "warning" });
    expect(result[0]!.message).toMatch(/--shadow-card stays a var\(\)/);
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

describe("duration and defaults", () => {
  function motion() {
    const ref = defineReferenceTokens({ fontFamily: { body: tokens.fontFamily("Arial") } });
    const system = defineSystemTokens({
      motion: {
        fast: tokens.duration("150ms"),
        ease: tokens.cubicBezier([0.24, 1, 0.4, 1]),
      },
      fontFamily: { sans: ref.fontFamily.body, mono: tokens.fontFamily("Menlo") },
    });
    const config = defineConfig({ tokens: { ref, system, components: {} } });
    return { ref, system, config } as never as ReturnType<typeof build>;
  }

  test("duration maps to --transition-duration-*", () => {
    const fixture = motion();
    const css = render({ theme: { duration: { fast: fixture.system.motion.fast } } }, fixture);
    expect(themeBlock(css)).toContain("--transition-duration-fast: var(--system-motion-fast);");
  });

  test("defaults map to --default-* keys", () => {
    const fixture = motion();
    const { system } = fixture as never as { system: Record<string, any> };
    const css = render(
      {
        theme: {
          defaults: {
            font: system.fontFamily.sans,
            monoFont: system.fontFamily.mono,
            transitionDuration: system.motion.fast,
            transitionTimingFunction: system.motion.ease,
          },
        },
      },
      fixture,
    );
    const block = themeBlock(css);
    expect(block).toContain("--default-font-family: var(--system-fontFamily-sans);");
    expect(block).toContain("--default-mono-font-family: var(--system-fontFamily-mono);");
    expect(block).toContain("--default-transition-duration: var(--system-motion-fast);");
    expect(block).toContain("--default-transition-timing-function: var(--system-motion-ease);");
  });

  test("defaults are not part of resetDefaults", () => {
    const fixture = motion();
    const { system } = fixture as never as { system: Record<string, any> };
    const css = render(
      { theme: { defaults: { font: system.fontFamily.sans } }, resetDefaults: true },
      fixture,
    );
    expect(css).not.toContain("initial");
  });

  test("a defaults token of the wrong $type is an error", () => {
    const fixture = motion();
    const { system } = fixture as never as { system: Record<string, any> };
    expect(() =>
      render({ theme: { defaults: { transitionDuration: system.fontFamily.sans } } }, fixture),
    ).toThrow(/theme\.defaults\.transitionDuration: expected a duration token, got fontFamily/);
  });
});

describe("layer", () => {
  test("token blocks are wrapped in @layer theme, the rest stays top-level", () => {
    const { system } = build();
    const css = render({ theme: { color: system.colors, text: system.typography } });
    expect(css).toMatch(/@layer theme \{\n {2}:root \{\n {4}--ref-color-primary:/);
    expect(css).toMatch(/\n {2}\.dark \{\n {4}--system-colors-accent: #111111;\n {2}\}\n\}/);
    expect(css).toMatch(/\n@theme inline \{/);
    expect(css).toMatch(/\n@custom-variant dark/);
  });

  test("a custom layer name", () => {
    expect(render({ layer: "tokens" })).toContain("@layer tokens {");
  });

  test("a layer that is not a CSS identifier throws", () => {
    expect(() => render({ layer: "theme { } body" })).toThrow(/Invalid tailwind layer/);
  });

  test("a dotted layer name is accepted", () => {
    expect(render({ layer: "base.tokens" })).toContain("@layer base.tokens {");
  });

  test("layer: false leaves the blocks unlayered", () => {
    const css = render({ layer: false });
    expect(css).not.toContain("@layer");
    expect(css).toMatch(/\n:root \{\n {2}--ref-color-primary:/);
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

  test("a theme named like a built-in variant warns, dark does not", () => {
    const fixture = build();
    const print = defineTheme(fixture.system, { colors: { accent: tokens.color("#000000") } });
    const config = defineConfig({
      tokens: { ref: fixture.ref, system: fixture.system, components: {} },
      themes: { dark: fixture.config.themes.dark!, print },
    });
    const result = diagnose({}, { ...fixture, config });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ severity: "warning" });
    expect((result[0] as { message: string }).message).toMatch(
      /"print" theme variant replaces Tailwind's built-in/,
    );
    expect(diagnose({ themeVariants: ["dark"] }, { ...fixture, config })).toEqual([]);
    expect(diagnose({ themeVariants: false }, { ...fixture, config })).toEqual([]);
    expect(diagnose({})).toEqual([]);
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
    expect(JSON.stringify(result)).toMatch(
      /text-heading is ambiguous with Tailwind's --color-heading/,
    );
  });
});

describe("real Tailwind compile", () => {
  test("utilities and the dark variant resolve against the generated stylesheet", async () => {
    const { compile } = await import("@tailwindcss/node");
    const { system } = build();
    // Must live under a node_modules dir so `@import "tailwindcss"` resolves. Hoisted installs
    // (e.g. CI) may not have a package-local one, so create it.
    const modulesDir = path.join(process.cwd(), "node_modules");
    await fs.mkdir(modulesDir, { recursive: true });
    const dir = await fs.mkdtemp(path.join(modulesDir, ".recontent-tailwind-"));
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
            duration: system.motion,
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
        "font-heading",
        "text-heading font-mono",
        "shadow-card/50",
        "duration-fast",
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
      expect(out).toMatch(
        /\.font-heading \{[^}]*font-family: var\(--system-typography-heading-font-family\)/,
      );
      expect(out).toMatch(/\.text-heading \{(?![^}]*font-family)[^}]*\}/);
      expect(out).toMatch(/\.shadow-card\\\/50 \{[^}]*--tw-shadow-alpha: 50%/);
      expect(out).toContain("0px 2px 4px 0px var(--tw-shadow-color, var(--ref-color-primary))");
      expect(out).toMatch(/\.duration-fast \{[^}]*var\(--system-motion-fast\)/);
      expect(out).toMatch(/:where\(\.dark, \.dark \*\)/);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
