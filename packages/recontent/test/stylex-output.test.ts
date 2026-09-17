import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "@jest/globals";
import * as babel from "@babel/core";
import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "../src/index.js";
import { generateStylexFiles, type StylexPluginOptions } from "../src/outputs/stylex.js";
import {
  assertParses,
  assertTypechecks,
  aliasChainConfig,
  compositeConfig,
  scaleConfig,
  themedConfig,
  type Fixture,
} from "./helpers/fixtures.js";
import type { Config, OutputFile } from "@recontentapp/core";
import type { PluginItem } from "@babel/core";

function generate(config: Config, options: StylexPluginOptions): OutputFile[] {
  return generateStylexFiles(config, options);
}

function generateFixture(fixture: Fixture): OutputFile[] {
  return generate(fixture.config, {
    outDir: "dist-test",
    fontFamily: fixture.ref.fontFamily.body,
    placeholderColor: fixture.ref.color.black,
  });
}

const require = createRequire(import.meta.url);
const stylexBabelPlugin = require("@stylexjs/babel-plugin") as {
  processStylexRules: (rules: unknown[]) => string;
};

function file(files: OutputFile[], filename: string): OutputFile {
  const found = files.find((f) => f.filename === filename);
  if (!found) throw new Error(`Missing generated file: ${filename}`);
  return found;
}

describe("tokens.stylex.ts", () => {
  test("emits a single defineVars call with flat, layer-prefixed keys", () => {
    const files = generateFixture(aliasChainConfig());
    const tokensFile = file(files, "tokens.stylex.ts");
    expect(tokensFile.content).toMatch(/import \* as stylex from "@stylexjs\/stylex";/);
    expect(tokensFile.content).toMatch(/export const vars = stylex\.defineVars\(\{/);
    expect(tokensFile.content).toMatch(/refColorBlack: '#000000',/);
    expect(tokensFile.content).toMatch(/refFontFamilyBody: 'Arial',/);
  });

  test("a plain alias flattens directly to the terminal ref key via a derived function", () => {
    const files = generateFixture(aliasChainConfig());
    const tokensFile = file(files, "tokens.stylex.ts");
    // system.colors.accent -> ref.color.black
    expect(tokensFile.content).toMatch(/systemColorsAccent: \(\) => `\$\{vars\.refColorBlack\}`,/);
    // components.button.background -> system.colors.accent -> ref.color.black (flattened, skips system)
    expect(tokensFile.content).toMatch(
      /componentsButtonBackground: \(\) => `\$\{vars\.refColorBlack\}`,/,
    );
  });

  test("the aliased key is emitted before the entry that references it (topological order)", () => {
    const files = generateFixture(aliasChainConfig());
    const tokensFile = file(files, "tokens.stylex.ts");
    const refIndex = tokensFile.content.indexOf("refColorBlack:");
    const systemIndex = tokensFile.content.indexOf("systemColorsAccent:");
    const componentsIndex = tokensFile.content.indexOf("componentsButtonBackground:");
    expect(refIndex).toBeGreaterThan(-1);
    expect(refIndex).toBeLessThan(systemIndex);
    expect(systemIndex).toBeLessThan(componentsIndex);
  });

  test("numeric and non-identifier scale keys sanitize into a valid flat identifier", () => {
    const files = generateFixture(scaleConfig());
    const tokensFile = file(files, "tokens.stylex.ts");
    expect(tokensFile.content).toMatch(/refSpacing05: '2px',/);
    expect(tokensFile.content).toMatch(/refColors200: '#222222',/);
  });

  test("an inline shadow with an aliased member emits a derived template literal", () => {
    const files = generateFixture(compositeConfig());
    const tokensFile = file(files, "tokens.stylex.ts");
    expect(tokensFile.content).toMatch(
      /systemShadowCard: \(\) => `0px 2px 4px 0px \$\{vars\.refColorBlack\}`,/,
    );
  });

  test("an expanded typography composite emits one flat key per cssProperty", () => {
    const files = generateFixture(compositeConfig());
    const tokensFile = file(files, "tokens.stylex.ts");
    expect(tokensFile.content).toMatch(
      /systemTypographyBodyFontFamily: \(\) => `\$\{vars\.refFontFamilyBody\}`,/,
    );
    expect(tokensFile.content).toMatch(/systemTypographyBodyFontSize: '16px',/);
    expect(tokensFile.content).not.toMatch(/"fontSize"/);
  });

  test("a circular alias throws", () => {
    const a = defineReferenceTokens({
      color: { a: tokens.color("#000000") },
      fontFamily: { body: tokens.fontFamily("Arial") },
    });
    const config = defineConfig({
      tokens: { ref: a, system: defineSystemTokens({}), components: {} },
    });
    config.registry.set("ref.color.a", {
      path: ["ref", "color", "a"],
      $type: "color",
      $value: a.color.a.$value,
      alias: ["ref", "color", "b"],
      layer: "ref",
    });
    config.registry.set("ref.color.b", {
      path: ["ref", "color", "b"],
      $type: "color",
      $value: a.color.a.$value,
      alias: ["ref", "color", "a"],
      layer: "ref",
    });
    expect(() =>
      generate(config, {
        outDir: "dist-test",
        fontFamily: a.fontFamily.body,
        placeholderColor: a.color.a,
      }),
    ).toThrow(/Circular alias detected at token path: ref\.color\./);
  });

  test("a key collision between two distinct token paths throws", () => {
    const ref = defineReferenceTokens({
      fooBar: tokens.color("#000000"),
      foo: { bar: tokens.color("#111111") },
      fontFamily: { body: tokens.fontFamily("Arial") },
    });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    expect(() =>
      generate(config, {
        outDir: "dist-test",
        fontFamily: ref.fontFamily.body,
        placeholderColor: ref.fooBar,
      }),
    ).toThrow(/StyleX key collision/);
  });

  test("every generated tokens.stylex.ts in this suite passes assertParses and assertTypechecks", () => {
    const fixtures: Fixture[] = [
      aliasChainConfig(),
      compositeConfig(),
      scaleConfig(),
      themedConfig({ layer: "ref" }),
      themedConfig({ layer: "system" }),
      themedConfig({ layer: "components" }),
    ];
    for (const fixture of fixtures) {
      const files = generateFixture(fixture);
      const tokensFile = file(files, "tokens.stylex.ts");
      assertParses(tokensFile.content, "tokens.stylex.ts");
      assertTypechecks(
        tokensFile.content.replace(
          'import * as stylex from "@stylexjs/stylex";',
          "declare const stylex: { defineVars<T>(v: T): T };",
        ),
        "tokens.stylex.ts",
      );
    }
  });
});

describe("reset.gen.css", () => {
  test("reset.gen.css is plain CSS with hardcoded design token values, never :focus-visible", () => {
    const files = generateFixture(aliasChainConfig());
    const resetCss = file(files, "reset.gen.css");
    expect(resetCss.content).toMatch(/font-family: Arial;/);
    expect(resetCss.content).toMatch(/color: #000000;/);
    expect(resetCss.content).toMatch(/\*, \*::before, \*::after \{/);
    expect(resetCss.content).not.toContain(":focus-visible");
    expect(resetCss.content).not.toContain("globalStyle");
  });
});

describe("themes.ts", () => {
  test("one <name>Theme createTheme call per theme, sorted", () => {
    const ref = defineReferenceTokens({
      color: { black: tokens.color("#000000") },
      fontFamily: { body: tokens.fontFamily("Arial") },
    });
    const system = defineSystemTokens({ colors: { accent: ref.color.black } });
    const bravo = defineTheme(ref, { color: { black: tokens.color("#111111") } });
    const alpha = defineTheme(ref, { color: { black: tokens.color("#222222") } });
    const config = defineConfig({
      tokens: { ref, system, components: {} },
      themes: { bravo, alpha },
    });
    const files = generate(config, {
      outDir: "dist-test",
      fontFamily: ref.fontFamily.body,
      placeholderColor: ref.color.black,
    });
    const themesFile = file(files, "themes.ts");
    expect(themesFile.content).toMatch(/export const alphaTheme = stylex\.createTheme\(vars, \{/);
    expect(themesFile.content).toMatch(/export const bravoTheme = stylex\.createTheme\(vars, \{/);
    expect(themesFile.content.indexOf("alphaTheme")).toBeLessThan(
      themesFile.content.indexOf("bravoTheme"),
    );
  });

  test("a directly overridden ref token becomes a literal createTheme override", () => {
    const files = generateFixture(themedConfig({ layer: "ref" }));
    const themesFile = file(files, "themes.ts");
    expect(themesFile.content).toMatch(/refColorBlack: '#111111',/);
  });

  test("only directly overridden keys are listed in the override object (indirection is left to CSS cascade)", () => {
    const files = generateFixture(themedConfig({ layer: "ref" }));
    const themesFile = file(files, "themes.ts");
    const darkBlock = themesFile.content.slice(themesFile.content.indexOf("darkTheme"));
    expect(darkBlock).toMatch(/refColorBlack: '#111111',/);
    expect(darkBlock).not.toMatch(/systemColorsAccent/);
    expect(darkBlock).not.toMatch(/componentsButtonBackground/);
  });

  test("a directly overridden system token overrides only that flat key", () => {
    const files = generateFixture(themedConfig({ layer: "system" }));
    const themesFile = file(files, "themes.ts");
    const darkBlock = themesFile.content.slice(themesFile.content.indexOf("darkTheme"));
    expect(darkBlock).toMatch(/systemColorsAccent: '#111111',/);
    expect(darkBlock).not.toMatch(/refColorBlack/);
  });

  test("a shadow member override literal is used even though the base composite aliases a ref color", () => {
    const ref = defineReferenceTokens({
      color: { black: tokens.color("#000000") },
      fontFamily: { body: tokens.fontFamily("Arial") },
    });
    const system = defineSystemTokens({
      shadow: {
        card: tokens.shadow({
          color: ref.color.black,
          offsetX: "0px",
          offsetY: "2px",
          blur: "4px",
          spread: "0px",
        }),
      },
    });
    const dark = defineTheme(system, {
      shadow: {
        card: tokens.shadow({
          color: "#eeeeee",
          offsetX: "0px",
          offsetY: "4px",
          blur: "8px",
          spread: "0px",
        }),
      },
    });
    const config = defineConfig({
      tokens: { ref, system, components: {} },
      themes: { dark },
    });
    const files = generate(config, {
      outDir: "dist-test",
      fontFamily: ref.fontFamily.body,
      placeholderColor: ref.color.black,
    });
    const themesFile = file(files, "themes.ts");
    expect(themesFile.content).toMatch(/systemShadowCard: '0px 4px 8px 0px #eeeeee',/);
  });

  test("every generated themes.ts in this suite passes assertParses", () => {
    const fixtures: Fixture[] = [
      themedConfig({ layer: "ref" }),
      themedConfig({ layer: "system" }),
      themedConfig({ layer: "components" }),
    ];
    for (const fixture of fixtures) {
      const files = generateFixture(fixture);
      assertParses(file(files, "themes.ts").content, "themes.ts");
    }
  });
});

describe("scales.ts", () => {
  test("a dimensionScale/colorScale emits type + const map of vars.<flatKey> per key", () => {
    const files = generateFixture(scaleConfig());
    const scalesFile = file(files, "scales.ts");
    expect(scalesFile.content).toMatch(/export type RefSpacing = 0 \| 1 \| "0-5";/);
    expect(scalesFile.content).toMatch(/0: vars\.refSpacing0,/);
    expect(scalesFile.content).toMatch(/"0-5": vars\.refSpacing05,/);
    expect(scalesFile.content).toMatch(/export type RefColors = 100 \| 200;/);
    expect(scalesFile.content).toMatch(/200: vars\.refColors200,/);
  });

  test("a typographyScale (expanded composite) exports only the union type, no const map", () => {
    const ref = defineReferenceTokens({
      color: { black: tokens.color("#000000") },
      fontFamily: { body: tokens.fontFamily("Arial") },
    });
    const system = defineSystemTokens({
      textStyles: tokens.typographyScale({
        body: { fontFamily: ref.fontFamily.body, fontSize: "14px", fontWeight: "regular" },
      }),
    });
    const config = defineConfig({
      tokens: { ref, system, components: {} },
    });
    const files = generate(config, {
      outDir: "dist-test",
      fontFamily: ref.fontFamily.body,
      placeholderColor: ref.color.black,
    });
    const scalesFile = file(files, "scales.ts");
    expect(scalesFile.content).toMatch(/export type SystemTextStyles = "body";/);
    expect(scalesFile.content).not.toMatch(/export const systemTextStyles/);
  });

  test("every generated scales.ts in this suite passes assertParses and assertTypechecks", () => {
    const files = generateFixture(scaleConfig());
    const scalesFile = file(files, "scales.ts");
    assertParses(scalesFile.content, "scales.ts");
    assertTypechecks(
      scalesFile.content.replace(
        'import { vars } from "./tokens.stylex.js";',
        "declare const vars: Record<string, string>;",
      ),
      "scales.ts",
    );
  });
});

describe("files", () => {
  test("generate returns exactly 4 files", () => {
    const files = generateFixture(aliasChainConfig());
    expect(files.map((f) => f.filename).sort()).toEqual(
      ["reset.gen.css", "scales.ts", "themes.ts", "tokens.stylex.ts"].sort(),
    );
  });
});

describe("StyleX compile test", () => {
  function compile(filePath: string): { code: string; rules: unknown[] } {
    const code = fs.readFileSync(filePath, "utf8");
    const result = babel.transformSync(code, {
      filename: filePath,
      presets: [],
      plugins: [
        [
          stylexBabelPlugin,
          {
            dev: false,
            unstable_moduleResolution: { type: "commonJS", rootDir: path.dirname(filePath) },
          },
        ] as unknown as PluginItem,
      ],
    });
    if (!result?.code) throw new Error("Babel produced no output");
    return { code: result.code, rules: (result.metadata as { stylex?: unknown[] }).stylex ?? [] };
  }

  test("generated tokens.stylex.ts / themes.ts compile to valid StyleX CSS", () => {
    const ref = defineReferenceTokens({
      color: { black: tokens.color("#000000") },
      fontFamily: { body: tokens.fontFamily("Arial") },
    });
    const system = defineSystemTokens({
      colors: { accent: ref.color.black },
      shadow: {
        card: tokens.shadow({
          color: ref.color.black,
          offsetX: "0px",
          offsetY: "2px",
          blur: "4px",
          spread: "0px",
        }),
      },
    });
    const dark = defineTheme(ref, { color: { black: tokens.color("#111111") } });
    const config = defineConfig({
      tokens: { ref, system, components: {} },
      themes: { dark },
    });
    const files = generate(config, {
      outDir: "dist-test",
      fontFamily: ref.fontFamily.body,
      placeholderColor: ref.color.black,
    });

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recontent-stylex-"));
    try {
      fs.writeFileSync(path.join(dir, "tokens.stylex.js"), file(files, "tokens.stylex.ts").content);
      fs.writeFileSync(path.join(dir, "themes.js"), file(files, "themes.ts").content);

      const tokensResult = compile(path.join(dir, "tokens.stylex.js"));
      const themesResult = compile(path.join(dir, "themes.js"));

      const css = stylexBabelPlugin.processStylexRules([
        ...tokensResult.rules,
        ...themesResult.rules,
      ]);

      // base var group declares a literal and the shadow's var() indirection
      expect(css).toMatch(/0px 2px 4px 0px var\(--/);
      // dark theme overrides only the ref color var, one declaration
      expect(css).toMatch(/#111111/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
