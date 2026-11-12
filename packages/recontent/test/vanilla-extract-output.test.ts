import { describe, expect, test } from "@jest/globals";
import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "../src/index.js";
import {
  generateVanillaExtractFiles,
  type VanillaExtractPluginOptions,
} from "../src/plugins/vanilla-extract/generate.js";
import {
  assertParses,
  aliasChainConfig,
  compositeConfig,
  scaleConfig,
  themedConfig,
  type Fixture,
} from "./helpers/fixtures.js";
import type { Config, OutputFile } from "@recontentapp/core";

type GenerateInput = Fixture | { config: Config; output: VanillaExtractPluginOptions };

function generate(input: GenerateInput): OutputFile[] {
  if ("ref" in input) {
    return generateVanillaExtractFiles(input.config, {
      outDir: "dist-test",
      fontFamily: input.ref.fontFamily.body,
      placeholderColor: input.ref.color.black,
    });
  }
  return generateVanillaExtractFiles(input.config, input.output);
}

describe("contract", () => {
  test("vars has ref/system/components roots and every leaf is null; refVars/systemVars/componentVars are re-exported", () => {
    const config = aliasChainConfig();
    const [file] = generate(config);
    expect(file!.content).toMatch(/export const vars = createThemeContract\(\{/);
    expect(file!.content).toMatch(/"ref": \{/);
    expect(file!.content).toMatch(/"system": \{/);
    expect(file!.content).toMatch(/"components": \{/);
    expect(file!.content).toMatch(/"black": null,/);
    expect(file!.content).toMatch(/export const refVars = vars\.ref;/);
    expect(file!.content).toMatch(/export const systemVars = vars\.system;/);
    expect(file!.content).toMatch(/export const componentVars = vars\.components;/);
  });

  test("expanded composites nest by camelCase cssProperty in the contract (vs kebab varSuffix in CSS)", () => {
    const config = compositeConfig();
    const [file] = generate(config);
    expect(file!.content).toMatch(/"typography": \{\s*"body": \{\s*"fontFamily": null,/);
    expect(file!.content).not.toMatch(/"font-family"/);
  });

  test("entryPath strips the layer segment for ref/system but keeps the full path for components", () => {
    const config = aliasChainConfig();
    const [file] = generate(config);
    expect(file!.content).toMatch(/"ref": \{\s*"color": \{\s*"black": null,/);
    expect(file!.content).toMatch(/"system": \{\s*"colors": \{\s*"accent": null,/);
    expect(file!.content).toMatch(/"components": \{\s*"button": \{\s*"background": null,/);
  });

  test('numeric and non-identifier path segments are emitted as [200] / ["0-5"], never .0-5', () => {
    const ref = defineReferenceTokens({
      __veColor: tokens.color("#000000"),
      __veFontFamily: tokens.fontFamily("Arial"),
      spacing: tokens.dimensionScale({ 0: "0px", "0-5": "2px" }),
      colors: tokens.colorScale({ 100: "#111111", 200: "#222222" }),
    });
    const system = defineSystemTokens({ gap: ref.spacing["0-5"], accent: ref.colors[200] });
    const config = defineConfig({
      tokens: { ref, system, components: {} },
    });
    const output: VanillaExtractPluginOptions = {
      outDir: "dist-test",
      fontFamily: ref.__veFontFamily,
      placeholderColor: ref.__veColor,
    };
    const [file] = generate({ config, output });
    expect(file!.content).toMatch(/"gap": vars\.ref\.spacing\["0-5"\],/);
    expect(file!.content).not.toMatch(/vars\.ref\.spacing\.0-5/);
    expect(file!.content).toMatch(/"accent": vars\.ref\.colors\[200\],/);
  });
});

describe("base themeClass", () => {
  test("an aliased scalar emits the unquoted reference vars.ref.color.black, not '#000000'", () => {
    const config = aliasChainConfig();
    const [file] = generate(config);
    const start = file!.content.indexOf("export const themeClass");
    const base = file!.content.slice(start, file!.content.indexOf("export const", start + 1));
    expect(base).toMatch(/"accent": vars\.ref\.color\.black,/);
  });

  test("a multi-hop alias resolves to the terminal var in the base tree", () => {
    const config = aliasChainConfig();
    const [file] = generate(config);
    const start = file!.content.indexOf("export const themeClass");
    const base = file!.content.slice(start, file!.content.indexOf("export const", start + 1));
    expect(base).toMatch(/"background": vars\.ref\.color\.black,/);
  });

  test("an inline shadow with an aliased member emits a template literal", () => {
    const config = compositeConfig();
    const [file] = generate(config);
    expect(file!.content).toMatch(/"card": `0px 2px 4px 0px \$\{vars\.ref\.color\.black\}`,/);
  });

  test("plain values are single-quoted", () => {
    const ref = defineReferenceTokens({
      __veColor: tokens.color("#000000"),
      __veFontFamily: tokens.fontFamily("Arial"),
    });
    const system = defineSystemTokens({ meta: { name: tokens.fontFamily("Segoe UI") } });
    const config = defineConfig({
      tokens: { ref, system, components: {} },
    });
    const output: VanillaExtractPluginOptions = {
      outDir: "dist-test",
      fontFamily: ref.__veFontFamily,
      placeholderColor: ref.__veColor,
    };
    const [file] = generate({ config, output });
    expect(file!.content).toMatch(/"name": 'Segoe UI',/);
  });

  test("`` and ${ are escaped inside template literals", () => {
    const ref = defineReferenceTokens({
      __veColor: tokens.color("#000000"),
      __veFontFamily: tokens.fontFamily("Arial"),
    });
    const system = defineSystemTokens({
      border: {
        weird: tokens.border({ color: "#000000", width: "1px" }),
      },
    });
    const config = defineConfig({
      tokens: { ref, system, components: {} },
    });
    const output: VanillaExtractPluginOptions = {
      outDir: "dist-test",
      fontFamily: ref.__veFontFamily,
      placeholderColor: ref.__veColor,
    };
    // Bypass tokens.color(...) validation to exercise escapeTemplateLiteral directly:
    // a colorSpace value is otherwise never attacker/author-controlled free text.
    config.registry.set("system.border.weird", {
      path: ["system", "border", "weird"],
      $type: "border",
      $value: {
        color: {
          $value: {
            colorSpace: "custom`${x}" as never,
            components: [0, 0, 0],
            alpha: 1,
            hex: "#000000",
          },
        },
        width: { $value: { value: 1, unit: "px" } },
        style: { $value: { style: "solid" } },
      },
      layer: "system",
    });
    const [file] = generate({ config, output });
    expect(file!.content).toMatch(/color\(custom\\`\\\$\{x\} 0 0 0\)/);
  });

  test("an aliased expanded composite emits vars.ref.typography.body.fontSize per member", () => {
    const ref = defineReferenceTokens({
      __veColor: tokens.color("#000000"),
      __veFontFamily: tokens.fontFamily("Arial"),
      typography: {
        base: tokens.typography({ fontFamily: "Arial", fontSize: "16px", fontWeight: "regular" }),
      },
    });
    const system = defineSystemTokens({ typography: { body: ref.typography.base } });
    const config = defineConfig({
      tokens: { ref, system, components: {} },
    });
    const output: VanillaExtractPluginOptions = {
      outDir: "dist-test",
      fontFamily: ref.__veFontFamily,
      placeholderColor: ref.__veColor,
    };
    const [file] = generate({ config, output });
    expect(file!.content).toMatch(/"fontSize": vars\.ref\.typography\.base\.fontSize,/);
    expect(file!.content).toMatch(/"fontFamily": vars\.ref\.typography\.base\.fontFamily,/);
  });
});

describe("theme classes (Fix B + C)", () => {
  test("one <name>ThemeClass per theme, exported in Object.keys(...).sort() order", () => {
    const ref = defineReferenceTokens({
      __veColor: tokens.color("#000000"),
      __veFontFamily: tokens.fontFamily("Arial"),
      color: { black: tokens.color("#000000") },
    });
    const system = defineSystemTokens({ colors: { accent: ref.color.black } });
    const bravo = defineTheme(ref, { color: { black: tokens.color("#111111") } });
    const alpha = defineTheme(ref, { color: { black: tokens.color("#222222") } });
    const config = defineConfig({
      tokens: { ref, system, components: {} },
      themes: { bravo, alpha },
    });
    const output: VanillaExtractPluginOptions = {
      outDir: "dist-test",
      fontFamily: ref.__veFontFamily,
      placeholderColor: ref.__veColor,
    };
    const [file] = generate({ config, output });
    expect(file!.content).toMatch(/export const alphaThemeClass = createTheme/);
    expect(file!.content).toMatch(/export const bravoThemeClass = createTheme/);
    expect(file!.content.indexOf("alphaThemeClass")).toBeLessThan(
      file!.content.indexOf("bravoThemeClass"),
    );
  });

  test("a directly overridden ref token becomes a literal in that theme's tree", () => {
    const config = themedConfig({ layer: "ref" });
    const [file] = generate(config);
    const darkBlock = file!.content.slice(file!.content.indexOf("darkThemeClass"));
    expect(darkBlock).toMatch(/"black": '#111111',/);
  });

  test("a system token aliasing an overridden ref token still emits vars.ref.color.black", () => {
    const config = themedConfig({ layer: "ref" });
    const [file] = generate(config);
    const darkBlock = file!.content.slice(file!.content.indexOf("darkThemeClass"));
    expect(darkBlock).toMatch(/"accent": vars\.ref\.color\.black,/);
    expect(darkBlock).not.toMatch(/"accent": '#111111',/);
  });

  test("a directly overridden system token is a literal, and a component token aliasing it references vars.system.…", () => {
    const config = themedConfig({ layer: "system" });
    const [file] = generate(config);
    const darkBlock = file!.content.slice(file!.content.indexOf("darkThemeClass"));
    expect(darkBlock).toMatch(/"accent": '#111111',/);
    expect(darkBlock).toMatch(/"background": vars\.system\.colors\.accent,/);
    expect(darkBlock).not.toMatch(/"background": vars\.ref\.color\.black,/);
  });

  test("a shadow whose member aliases an overridden ref color keeps its template literal", () => {
    const ref = defineReferenceTokens({
      __veColor: tokens.color("#000000"),
      __veFontFamily: tokens.fontFamily("Arial"),
      color: { black: tokens.color("#000000") },
    });
    const dark = defineTheme(ref, { color: { black: tokens.color("#111111") } });
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
    const config = defineConfig({
      tokens: { ref, system, components: {} },
      themes: { dark },
    });
    const output: VanillaExtractPluginOptions = {
      outDir: "dist-test",
      fontFamily: ref.__veFontFamily,
      placeholderColor: ref.__veColor,
    };
    const [file] = generate({ config, output });
    const darkBlock = file!.content.slice(file!.content.indexOf("darkThemeClass"));
    expect(darkBlock).toMatch(/"card": `0px 2px 4px 0px \$\{vars\.ref\.color\.black\}`,/);
  });

  test("an override whose value is 0 is applied (Fix C)", () => {
    const ref = defineReferenceTokens({
      __veColor: tokens.color("#000000"),
      __veFontFamily: tokens.fontFamily("Arial"),
      spacing: { none: tokens.dimension("4px") },
    });
    const dark = defineTheme(ref, { spacing: { none: tokens.dimension("0px") } });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
      themes: { dark },
    });
    const output: VanillaExtractPluginOptions = {
      outDir: "dist-test",
      fontFamily: ref.__veFontFamily,
      placeholderColor: ref.__veColor,
    };
    const [file] = generate({ config, output });
    const darkBlock = file!.content.slice(file!.content.indexOf("darkThemeClass"));
    expect(darkBlock).toMatch(/"none": '0px',/);
  });

  test("a theme overriding one scale member replaces only that member", () => {
    const ref = defineReferenceTokens({
      __veColor: tokens.color("#000000"),
      __veFontFamily: tokens.fontFamily("Arial"),
      spacing: tokens.dimensionScale({ 0: "0px", 1: "4px", 2: "8px" }),
    });
    const dark = defineTheme(ref, {
      spacing: tokens.dimensionScale({ 0: "0px", 1: "100px", 2: "8px" }),
    });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
      themes: { dark },
    });
    const output: VanillaExtractPluginOptions = {
      outDir: "dist-test",
      fontFamily: ref.__veFontFamily,
      placeholderColor: ref.__veColor,
    };
    const [file] = generate({ config, output });
    const darkBlock = file!.content.slice(file!.content.indexOf("darkThemeClass"));
    expect(darkBlock).toMatch(/"1": '100px',/);
    expect(darkBlock).toMatch(/"0": '0px',/);
    expect(darkBlock).toMatch(/"2": '8px',/);
  });
});

describe("scales, errors, files", () => {
  test("a dimension scale emits its type/const exports; a colorScale likewise", () => {
    const config = scaleConfig();
    const [file] = generate(config);
    expect(file!.content).toMatch(/export type RefSpacing = 0 \| 1 \| "0-5";/);
    expect(file!.content).toMatch(/export const refSpacing = vars\.ref\.spacing;/);
    expect(file!.content).toMatch(/export type RefColors = 100 \| 200;/);
    expect(file!.content).toMatch(/export const refColors = vars\.ref\.colors;/);
  });

  test("non-dimension/color scale types are exported too", () => {
    const ref = defineReferenceTokens({
      __veColor: tokens.color("#000000"),
      __veFontFamily: tokens.fontFamily("Arial"),
      labels: tokens.numberScale({ a: 1, b: 2 }),
    });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    const output: VanillaExtractPluginOptions = {
      outDir: "dist-test",
      fontFamily: ref.__veFontFamily,
      placeholderColor: ref.__veColor,
    };
    const [file] = generate({ config, output });
    expect(file!.content).toMatch(/export type RefLabels = "a" \| "b";/);
    expect(file!.content).toMatch(/export const refLabels = vars\.ref\.labels;/);
  });

  test("a transitionScale emits its type/const exports", () => {
    const ref = defineReferenceTokens({
      __veColor: tokens.color("#000000"),
      __veFontFamily: tokens.fontFamily("Arial"),
      transitions: tokens.transitionScale({
        fast: { duration: "100ms", timingFunction: [0.4, 0, 0.2, 1] },
        slow: { duration: "400ms", timingFunction: [0.4, 0, 0.2, 1] },
      }),
    });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    const output: VanillaExtractPluginOptions = {
      outDir: "dist-test",
      fontFamily: ref.__veFontFamily,
      placeholderColor: ref.__veColor,
    };
    const [file] = generate({ config, output });
    expect(file!.content).toMatch(/export type RefTransitions = "fast" \| "slow";/);
    expect(file!.content).toMatch(/export const refTransitions = vars\.ref\.transitions;/);
  });

  test("a scale referenced by many entries is exported once", () => {
    const config = scaleConfig();
    const [file] = generate(config);
    expect(file!.content.match(/export const refSpacing = /g)?.length).toBe(1);
  });

  test("a circular alias throws", () => {
    const a = defineReferenceTokens({
      __veColor: tokens.color("#000000"),
      __veFontFamily: tokens.fontFamily("Arial"),
      color: { a: tokens.color("#000000") },
    });
    // Manually construct a registry with a circular alias: a -> b -> a.
    const config = defineConfig({
      tokens: { ref: a, system: defineSystemTokens({}), components: {} },
    });
    const output: VanillaExtractPluginOptions = {
      outDir: "dist-test",
      fontFamily: a.__veFontFamily,
      placeholderColor: a.__veColor,
    };
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
    expect(() => generate({ config, output })).toThrow(
      /Circular alias detected at token path: ref\.color\./,
    );
  });

  test("a missing alias target throws", () => {
    const a = defineReferenceTokens({
      __veColor: tokens.color("#000000"),
      __veFontFamily: tokens.fontFamily("Arial"),
      color: { a: tokens.color("#000000") },
    });
    const config = defineConfig({
      tokens: { ref: a, system: defineSystemTokens({}), components: {} },
    });
    const output: VanillaExtractPluginOptions = {
      outDir: "dist-test",
      fontFamily: a.__veFontFamily,
      placeholderColor: a.__veColor,
    };
    config.registry.set("ref.color.a", {
      path: ["ref", "color", "a"],
      $type: "color",
      $value: a.color.a.$value,
      alias: ["ref", "color", "missing"],
      layer: "ref",
    });
    expect(() => generate({ config, output })).toThrow("Alias target not found: ref.color.missing");
  });

  test("generate returns exactly tokens.css.ts and reset.gen.css.ts", () => {
    const config = aliasChainConfig();
    const files = generate(config);
    expect(files.map((file) => file.filename)).toEqual(["tokens.css.ts", "reset.gen.css.ts"]);
  });

  test("reset.gen.css.ts is always emitted using globalStyle()", () => {
    const config = aliasChainConfig();
    const files = generate(config);
    const resetFile = files.find((file) => file.filename === "reset.gen.css.ts");
    expect(resetFile).toBeDefined();
    expect(resetFile!.content).toMatch(/import \{ globalStyle \} from "@vanilla-extract\/css";/);
    expect(resetFile!.content).toMatch(/globalStyle\("\*, \*::before, \*::after", \{/);
  });

  test("reset.gen.css.ts never contains a :focus-visible rule", () => {
    const config = aliasChainConfig();
    const files = generate(config);
    const resetFile = files.find((file) => file.filename === "reset.gen.css.ts");
    expect(resetFile).toBeDefined();
    expect(resetFile!.content).not.toContain(":focus-visible");
  });

  test("every generated tokens.css.ts in this suite passes assertParses", () => {
    const configs = [
      aliasChainConfig(),
      compositeConfig(),
      scaleConfig(),
      themedConfig({ layer: "ref" }),
      themedConfig({ layer: "system" }),
      themedConfig({ layer: "components" }),
    ];
    for (const config of configs) {
      const [file] = generate(config);
      assertParses(file!.content);
    }
  });
});
