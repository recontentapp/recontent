import { describe, expect, test } from "@jest/globals";
import {
  defineComponentTokens,
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "../../src/index.js";
import { css, generateCssFiles, generateCss } from "../../src/plugins/css.js";
import { aliasChainConfig, refOnlyConfig, scaleConfig, themedConfig } from "../helpers/fixtures.js";

describe("reference preservation", () => {
  test("a system token aliasing a ref color emits var(--ref-color-black), and the hex appears only in the :root ref block", () => {
    const { config } = aliasChainConfig();
    const css = generateCss(config);
    expect(css).toMatch(/--system-colors-accent: var\(--ref-color-black\);/);

    const blocks = css.split(/\n\n/);
    const refBlock = blocks[0]!;
    expect(refBlock).toMatch(/--ref-color-black: #000000;/);
    for (const block of blocks.slice(1)) {
      expect(block).not.toMatch(/#000000/);
    }
  });

  test("a 3-hop chain emits one hop per level, never a flattened value", () => {
    const { config } = aliasChainConfig();
    const css = generateCss(config);
    expect(css).toMatch(/--button-background: var\(--system-colors-accent\);/);
    expect(css).toMatch(/--system-colors-accent: var\(--ref-color-black\);/);
    expect(css).not.toMatch(/--button-background: #000000;/);
  });

  test("scale entries emit one var per key, including non-identifier keys", () => {
    const { config } = scaleConfig();
    const css = generateCss(config);
    expect(css).toMatch(/--ref-spacing-0: 0px;/);
    expect(css).toMatch(/--ref-spacing-0-5: 2px;/);
    expect(css).toMatch(/--ref-spacing-1: 4px;/);
    expect(css).toMatch(/--ref-colors-100: #111111;/);
    expect(css).toMatch(/--ref-colors-200: #222222;/);
  });
});

describe("composites", () => {
  test("a multi-layer shadow joins layers with ', ' and honours inset", () => {
    const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
    const system = defineSystemTokens({
      shadow: {
        elevated: tokens.shadow([
          {
            color: ref.color.black,
            offsetX: "0px",
            offsetY: "1px",
            blur: "2px",
            spread: "0px",
            inset: true,
          },
          { color: "#111111", offsetX: "0px", offsetY: "4px", blur: "8px", spread: "0px" },
        ]),
      },
    });
    const config = defineConfig({
      tokens: { ref, system, components: {} },
    });
    const css = generateCss(config);
    expect(css).toMatch(
      /--system-shadow-elevated: inset 0px 1px 2px 0px var\(--ref-color-black\), 0px 4px 8px 0px #111111;/,
    );
  });

  test("a system typography token aliasing a ref typography token emits a var() per member (the aliasPath branch)", () => {
    const ref = defineReferenceTokens({
      typography: {
        base: tokens.typography({ fontFamily: "Arial", fontSize: "16px", fontWeight: "regular" }),
      },
    });
    const system = defineSystemTokens({ typography: { body: ref.typography.base } });
    const config = defineConfig({
      tokens: { ref, system, components: {} },
    });
    const css = generateCss(config);
    expect(css).toMatch(
      /--system-typography-body-font-size: var\(--ref-typography-base-font-size\);/,
    );
    expect(css).toMatch(
      /--system-typography-body-font-family: var\(--ref-typography-base-font-family\);/,
    );
    expect(css).toMatch(
      /--system-typography-body-font-weight: var\(--ref-typography-base-font-weight\);/,
    );
  });
});

describe("themes", () => {
  test('a ref override produces a [data-theme="dark"] block containing only the overridden var', () => {
    const { config } = themedConfig({ layer: "ref" });
    const css = generateCss(config);
    const match = css.match(/\[data-theme="dark"\] \{\n([\s\S]*?)\n\}/);
    expect(match).not.toBeNull();
    // The system and component tokens aliasing it follow through var(), so they are not repeated.
    expect(match![1]).toBe("  --ref-color-black: #111111;");
  });

  test("a system-layer override produces a theme block (Fix A)", () => {
    const { config } = themedConfig({ layer: "system" });
    const css = generateCss(config);
    const match = css.match(/\[data-theme="dark"\] \{\n([\s\S]*?)\n\}/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("  --system-colors-accent: #111111;");
  });

  test("a theme alias emits var() instead of the target's value", () => {
    const { config } = themedConfig({ layer: "system", alias: true });
    const css = generateCss(config);
    const match = css.match(/\[data-theme="dark"\] \{\n([\s\S]*?)\n\}/);
    expect(match![1]).toBe("  --system-colors-accent: var(--ref-color-white);");
  });

  test("a component-layer override produces a theme block", () => {
    const { config } = themedConfig({ layer: "components" });
    const css = generateCss(config);
    const match = css.match(/\[data-theme="dark"\] \{\n([\s\S]*?)\n\}/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("  --button-background: #111111;");
  });

  test("an overridden expanded composite emits per-member declarations in the theme block", () => {
    const ref = defineReferenceTokens({});
    const system = defineSystemTokens({
      typography: {
        body: tokens.typography({ fontFamily: "Arial", fontSize: "16px", fontWeight: "regular" }),
      },
    });
    const dark = defineTheme(system, {
      typography: {
        body: tokens.typography({ fontFamily: "Georgia", fontSize: "18px", fontWeight: "bold" }),
      },
    });
    const config = defineConfig({
      tokens: { ref, system, components: {} },
      themes: { dark },
    });
    const css = generateCss(config);
    const match = css.match(/\[data-theme="dark"\] \{\n([\s\S]*?)\n\}/);
    expect(match![1]).toMatch(/--system-typography-body-font-family: Georgia;/);
    expect(match![1]).toMatch(/--system-typography-body-font-size: 18px;/);
    expect(match![1]).toMatch(/--system-typography-body-font-weight: 700;/);
  });

  test("two themes produce two blocks in Object.entries(config.themes) declaration order", () => {
    const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
    const system = defineSystemTokens({ colors: { accent: ref.color.black } });
    const dark = defineTheme(ref, { color: { black: tokens.color("#111111") } });
    const light = defineTheme(ref, { color: { black: tokens.color("#eeeeee") } });
    const config = defineConfig({
      tokens: { ref, system, components: {} },
      themes: { dark, light },
    });
    const css = generateCss(config);
    const darkIndex = css.indexOf('[data-theme="dark"]');
    const lightIndex = css.indexOf('[data-theme="light"]');
    expect(darkIndex).toBeGreaterThan(-1);
    expect(lightIndex).toBeGreaterThan(darkIndex);
  });

  test("a theme override referencing a token path outside the registry throws", () => {
    const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
    const otherRef = defineReferenceTokens({ color: { special: tokens.color("#000000") } });
    const empty = defineTheme(otherRef, { color: { special: tokens.color("#111111") } });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
      themes: { empty },
    });
    expect(() => generateCss(config)).toThrow(/Theme override references an unknown token path/);
  });
});

describe("structure & options", () => {
  test("block order is :root(ref) -> :root(system) -> :root(components) -> theme blocks, and empty blocks are skipped", () => {
    const { config } = themedConfig({ layer: "ref" });
    const css = generateCss(config);
    const blocks = css.split(/\n\n/);
    expect(blocks.length).toBe(4);
    expect(blocks[0]).toMatch(/^:root \{/);
    expect(blocks[0]).toMatch(/--ref-color-black/);
    expect(blocks[1]).toMatch(/^:root \{/);
    expect(blocks[1]).toMatch(/--system-colors-accent/);
    expect(blocks[2]).toMatch(/^:root \{/);
    expect(blocks[2]).toMatch(/--button-background/);
    expect(blocks[3]).toMatch(/^\[data-theme="dark"\] \{/);
  });

  test("default selector is [data-theme=\"x\"]; themeSelector 'class' emits .x; themeAttribute is honoured", () => {
    const { config } = themedConfig({ layer: "ref" });
    expect(generateCss(config)).toMatch(/\[data-theme="dark"\]/);
    expect(generateCss(config, { themeSelector: "class" })).toMatch(/\.dark \{/);
    expect(generateCss(config, { themeAttribute: "data-mode" })).toMatch(/\[data-mode="dark"\]/);
  });

  test("generateCssFiles returns exactly one tokens.css with class selectors, by default or when the selector is undefined", () => {
    const { config } = themedConfig({ layer: "ref" });
    const files = generateCssFiles(config, { outDir: "dist-test" });
    expect(files.length).toBe(1);
    expect(files[0]!.filename).toBe("tokens.css");
    expect(files[0]!.content).toMatch(/\.dark \{/);

    const [explicit] = generateCssFiles(config, { outDir: "dist-test", themeSelector: undefined });
    expect(explicit!.content).toBe(files[0]!.content);
  });

  test("filename renames the output file", () => {
    const { config } = themedConfig({ layer: "ref" });
    const files = generateCssFiles(config, { outDir: "out", filename: "theme.css" });
    expect(files.map((file) => file.filename)).toEqual(["theme.css"]);
  });

  test("prefix namespaces every variable it declares and references, themes included", () => {
    const ref = defineReferenceTokens({
      color: { black: tokens.color("#000000") },
      typography: {
        base: tokens.typography({ fontFamily: "Arial", fontSize: "16px", fontWeight: "regular" }),
      },
    });
    const system = defineSystemTokens({
      accent: ref.color.black,
      body: ref.typography.base,
      card: tokens.shadow({
        color: ref.color.black,
        offsetX: "0px",
        offsetY: "2px",
        blur: "4px",
        spread: "0px",
      }),
    });
    const components = defineComponentTokens({ button: { background: system.accent } });
    const dark = defineTheme(ref, { color: { black: tokens.color("#111111") } });
    const output = generateCss(
      defineConfig({ tokens: { ref, system, components }, themes: { dark } }),
      { prefix: "ds" },
    );

    expect(output).toContain("--ds-ref-color-black: #000000;");
    expect(output).toContain("--ds-system-accent: var(--ds-ref-color-black);");
    expect(output).toContain(
      "--ds-system-body-font-size: var(--ds-ref-typography-base-font-size);",
    );
    expect(output).toContain("0px 2px 4px 0px var(--ds-ref-color-black)");
    expect(output).toContain("--ds-button-background: var(--ds-system-accent);");
    expect(output).toContain('[data-theme="dark"] {\n  --ds-ref-color-black: #111111;');
    expect(output).not.toMatch(/--(?!ds-)[a-z]/);
  });

  test("a prefix that is no CSS identifier throws", () => {
    const { config } = themedConfig({ layer: "ref" });
    expect(() => generateCss(config, { prefix: "ds;}" })).toThrow(/prefix/);
  });

  test("a description cannot close the comment it is emitted in", () => {
    const ref = defineReferenceTokens({
      evil: tokens.color("#000000").describe("x */ body{display:none} /* y"),
    });
    const config = refOnlyConfig(ref);
    const css = generateCss(config);
    expect(css).toContain("/* x *\\/ body{display:none} /* y */");
    expect(css.replace(/\/\*[\s\S]*?\*\//g, "")).not.toContain("display:none");
  });

  test("a theme name that is no TypeScript identifier is fine, hyphens are valid in CSS", () => {
    const { config } = themedConfig({ layer: "ref", name: "dark-mode" });
    expect(generateCss(config)).toContain('[data-theme="dark-mode"]');
  });

  test("a themeAttribute containing a quote throws", () => {
    const { config } = themedConfig({ layer: "ref" });
    expect(() => generateCss(config, { themeAttribute: 'data-theme"]{color:red}[x=' })).toThrow(
      /themeAttribute .* cannot be used with the "css" output target/,
    );
  });

  test("a tokenless config yields an empty string", () => {
    const config = defineConfig({
      tokens: {
        ref: defineReferenceTokens({}),
        system: defineSystemTokens({}),
        components: defineComponentTokens({}),
      },
    });
    expect(generateCss(config)).toBe("");
  });
});

describe("themeAttribute without the attribute selector", () => {
  const ctx = {} as never;

  test("css warns that it is ignored", () => {
    const warnings = css({ outDir: "out", themeAttribute: "data-mode" }).validate!(ctx);
    expect(warnings).toEqual([
      expect.objectContaining({
        severity: "warning",
        message: expect.stringContaining("themeAttribute"),
      }),
    ]);
  });

  test("an explicit undefined selector counts as the class default", () => {
    expect(
      css({ outDir: "out", themeSelector: undefined, themeAttribute: "data-mode" }).validate!(ctx),
    ).toHaveLength(1);
  });

  test("and stays quiet when the selector is attribute, or no attribute is set", () => {
    expect(
      css({ outDir: "out", themeSelector: "attribute", themeAttribute: "data-mode" }).validate!(
        ctx,
      ),
    ).toEqual([]);
    expect(css({ outDir: "out" }).validate!(ctx)).toEqual([]);
  });
});
