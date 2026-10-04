import { describe, expect, test } from "@jest/globals";
import {
  defineComponentTokens,
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "../src/index.js";
import { generateCssFiles, generateCss } from "../src/plugins/css.js";
import {
  aliasChainConfig,
  compositeConfig,
  scaleConfig,
  themedConfig,
} from "./helpers/fixtures.js";
import type { OutputFile } from "@recontentapp/core";

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

  test("a component token aliasing a system token emits var(--system-...) with no layer prefix in its own var name", () => {
    const { config } = aliasChainConfig();
    const css = generateCss(config);
    expect(css).toMatch(/--button-background: var\(--system-colors-accent\);/);
  });

  test("a 3-hop chain emits one hop per level, never a flattened value", () => {
    const { config } = aliasChainConfig();
    const css = generateCss(config);
    expect(css).toMatch(/--button-background: var\(--system-colors-accent\);/);
    expect(css).toMatch(/--system-colors-accent: var\(--ref-color-black\);/);
    expect(css).not.toMatch(/--button-background: #000000;/);
  });

  test("non-aliased ref tokens emit serialized literals", () => {
    const ref = defineReferenceTokens({
      color: { black: tokens.color("#000000") },
      spacing: { md: tokens.dimension("8px") },
      weight: { brand: tokens.fontWeight(500) },
    });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    const css = generateCss(config);
    expect(css).toMatch(/--ref-color-black: #000000;/);
    expect(css).toMatch(/--ref-spacing-md: 8px;/);
    expect(css).toMatch(/--ref-weight-brand: 500;/);
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
  test("an inline shadow with an aliased color emits one declaration embedding var(--ref-color-black)", () => {
    const { config } = compositeConfig();
    const css = generateCss(config);
    expect(css).toMatch(/--system-shadow-card: 0px 2px 4px 0px var\(--ref-color-black\);/);
  });

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

  test("a border emits width style color", () => {
    const { config } = compositeConfig();
    const css = generateCss(config);
    expect(css).toMatch(/--system-border-default: 1px solid var\(--ref-color-black\);/);
  });

  test("gradients render linear with the angle, radial without it, and conic with 'from'", () => {
    const ref = defineReferenceTokens({});
    const system = defineSystemTokens({
      gradient: {
        linear: tokens.gradient({
          angle: "90deg",
          stops: [
            { color: "#000000", position: 0 },
            { color: "#ffffff", position: 1 },
          ],
        }),
        radial: tokens.gradient({
          kind: "radial",
          stops: [
            { color: "#000000", position: 0 },
            { color: "#ffffff", position: 1 },
          ],
        }),
        conic: tokens.gradient({
          kind: "conic",
          angle: "45deg",
          stops: [
            { color: "#000000", position: 0 },
            { color: "#ffffff", position: 0.5 },
          ],
        }),
      },
    });
    const config = defineConfig({
      tokens: { ref, system, components: {} },
    });
    const css = generateCss(config);
    expect(css).toMatch(
      /--system-gradient-linear: linear-gradient\(90deg, #000000 0%, #ffffff 100%\);/,
    );
    expect(css).toMatch(/--system-gradient-radial: radial-gradient\(#000000 0%, #ffffff 100%\);/);
    expect(css).toMatch(
      /--system-gradient-conic: conic-gradient\(from 45deg, #000000 0%, #ffffff 50%\);/,
    );
  });

  test("an expanded typography token emits 5 kebab-suffixed declarations, with fontWeight 'regular' resolving to 400", () => {
    const { config } = compositeConfig();
    const css = generateCss(config);
    expect(css).toMatch(/--system-typography-body-font-size: 16px;/);
    expect(css).toMatch(/--system-typography-body-font-weight: 400;/);
    expect(css).toMatch(/--system-typography-body-letter-spacing: 0px;/);
    expect(css).toMatch(/--system-typography-body-line-height: 1\.4;/);
    expect(css).toMatch(/--system-typography-body-font-family: var\(--ref-fontFamily-body\);/);
  });

  test("an expanded transition token emits 3 declarations including the defaulted 0ms delay", () => {
    const { config } = compositeConfig();
    const css = generateCss(config);
    expect(css).toMatch(/--system-transition-standard-transition-duration: 200ms;/);
    expect(css).toMatch(/--system-transition-standard-transition-delay: 0ms;/);
    expect(css).toMatch(
      /--system-transition-standard-transition-timing-function: cubic-bezier\(0\.4, 0, 0\.2, 1\);/,
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
    expect(match![1]).toBe("  --ref-color-black: #111111;");
  });

  test("a system-layer override produces a theme block (Fix A)", () => {
    const { config } = themedConfig({ layer: "system" });
    const css = generateCss(config);
    const match = css.match(/\[data-theme="dark"\] \{\n([\s\S]*?)\n\}/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("  --system-colors-accent: #111111;");
  });

  test("a component-layer override produces a theme block", () => {
    const { config } = themedConfig({ layer: "components" });
    const css = generateCss(config);
    const match = css.match(/\[data-theme="dark"\] \{\n([\s\S]*?)\n\}/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("  --button-background: #111111;");
  });

  test("a system token aliasing an overridden ref token is not duplicated into the theme block", () => {
    const { config } = themedConfig({ layer: "ref" });
    const css = generateCss(config);
    const match = css.match(/\[data-theme="dark"\] \{\n([\s\S]*?)\n\}/);
    expect(match![1]).not.toMatch(/--system-colors-accent/);
    expect(match![1]).not.toMatch(/--button-background/);
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
  test("block order is :root(ref) -> theme blocks -> :root(system) -> :root(components), and empty blocks are skipped", () => {
    const { config } = themedConfig({ layer: "ref" });
    const css = generateCss(config);
    const blocks = css.split(/\n\n/);
    expect(blocks.length).toBe(4);
    expect(blocks[0]).toMatch(/^:root \{/);
    expect(blocks[0]).toMatch(/--ref-color-black/);
    expect(blocks[1]).toMatch(/^\[data-theme="dark"\] \{/);
    expect(blocks[2]).toMatch(/^:root \{/);
    expect(blocks[2]).toMatch(/--system-colors-accent/);
    expect(blocks[3]).toMatch(/^:root \{/);
    expect(blocks[3]).toMatch(/--button-background/);
  });

  test("default selector is [data-theme=\"x\"]; themeSelector 'class' emits .x; themeAttribute is honoured", () => {
    const { config } = themedConfig({ layer: "ref" });
    expect(generateCss(config)).toMatch(/\[data-theme="dark"\]/);
    expect(generateCss(config, { themeSelector: "class" })).toMatch(/\.dark \{/);
    expect(generateCss(config, { themeAttribute: "data-mode" })).toMatch(/\[data-mode="dark"\]/);
  });

  test("generateCssFiles returns exactly one file named tokens.css and uses class selectors", () => {
    const { config } = themedConfig({ layer: "ref" });
    const files = generateCssFiles(config, {
      outDir: "dist-test",
    }) as OutputFile[];
    expect(files.length).toBe(1);
    expect(files[0]!.filename).toBe("tokens.css");
    expect(files[0]!.content).toMatch(/\.dark \{/);
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
