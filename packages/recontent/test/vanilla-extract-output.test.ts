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
// import type { BuiltInComponentOptions } from "../src/plugins/vanilla-extract/registry/manifest.js";
// import { MissingDesignTokensError } from "../src/plugins/vanilla-extract/registry/index.js";
import {
  assertParses,
  aliasChainConfig,
  compositeConfig,
  scaleConfig,
  themedConfig,
  type Fixture,
} from "./helpers/fixtures.js";
import type { Config, OutputFile, ScaleBinding } from "@recontentapp/core";

type GenerateInput = Fixture | { config: Config; output: VanillaExtractPluginOptions };

function generate(input: GenerateInput): OutputFile[] {
  if ("ref" in input) {
    return generateVanillaExtractFiles(input.config, {
      outDir: "dist-test",
      focusRingColor: input.ref.color.black,
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
      focusRingColor: ref.__veColor,
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
      focusRingColor: ref.__veColor,
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
      focusRingColor: ref.__veColor,
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
      focusRingColor: ref.__veColor,
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
      focusRingColor: ref.__veColor,
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
      focusRingColor: ref.__veColor,
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
      focusRingColor: ref.__veColor,
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
      focusRingColor: ref.__veColor,
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
      focusRingColor: ref.__veColor,
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
      focusRingColor: ref.__veColor,
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
      focusRingColor: a.__veColor,
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
      focusRingColor: a.__veColor,
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

  test("generate with no builtInComponents returns tokens.css.ts and reset.gen.css.ts", () => {
    const config = aliasChainConfig();
    const files = generate(config);
    expect(files.length).toBe(2);
    expect(files.some((file) => file.filename === "tokens.css.ts")).toBe(true);
    expect(files.some((file) => file.filename === "reset.gen.css.ts")).toBe(true);
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

  // TODO(built-in components): re-enable with the feature.
  //   test("generate with components additionally emits component files and components.dependencies.json", () => {
  //     const ref = defineReferenceTokens({
  //       __veColor: tokens.color("#000000"),
  //       __veFontFamily: tokens.fontFamily("Arial"),
  //       color: { black: tokens.color("#000000") },
  //     });
  //     const system = defineSystemTokens({
  //       colors: { surface: ref.color.black },
  //       spacing: tokens.dimensionScale({ 0: "0px", 1: "4px" }),
  //     });
  //     const config = defineConfig({
  //       tokens: { ref, system, components: {} },
  //     });
  //     const output: VanillaExtractPluginOptions = {
  //       outDir: "dist-test",
  //       builtInComponents: {
  //         Stack: { spacing: system.spacing },
  //       },
  //       focusRingColor: ref.__veColor,
  //       fontFamily: ref.__veFontFamily,
  //       placeholderColor: ref.__veColor,
  //     };
  //     const files = generate({ config, output });
  //     const filenames = files.map((file) => file.filename);
  //     expect(filenames).toContain("tokens.css.ts");
  //     expect(filenames).toContain("renderElement.gen.tsx");
  //     expect(filenames).toContain("components/stack/Stack.gen.css.ts");
  //     expect(filenames).toContain("components/stack/Stack.gen.tsx");
  //     expect(filenames).toContain("components.dependencies.json");
  //     const dependencies = files.find((file) => file.filename === "components.dependencies.json")!;
  //     expect(JSON.parse(dependencies.content)).toEqual({
  //       "@vanilla-extract/css": "^1.17.4",
  //       react: ">=18",
  //     });
  //   });
  //
  //   test("a typo in a built-in component name is rejected at compile time", () => {
  //     const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
  //     const system = defineSystemTokens({
  //       colors: { surface: ref.color.black },
  //       spacing: tokens.dimensionScale({ 0: "0px", 1: "4px" }),
  //     });
  //     const builtInComponents: BuiltInComponentOptions = {
  //       // @ts-expect-error "Stak" is not a known built-in component name
  //       Stak: { spacing: system.spacing },
  //     };
  //     expect(builtInComponents).toBeDefined();
  //   });
  //
  //   test("a typo in a built-in component binding key is rejected at compile time", () => {
  //     const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
  //     const system = defineSystemTokens({
  //       colors: { surface: ref.color.black },
  //       spacing: tokens.dimensionScale({ 0: "0px", 1: "4px" }),
  //     });
  //     const builtInComponents: BuiltInComponentOptions = {
  //       Stack: {
  //         spacing: system.spacing,
  //         // @ts-expect-error "spacingScale" is not a valid Stack binding key
  //         spacingScale: system.spacing,
  //       },
  //     };
  //     expect(builtInComponents).toBeDefined();
  //   });
  //
  //   test("Stack.gen.css.ts and Stack.gen.tsx content reference the resolved token/scale bindings", () => {
  //     const ref = defineReferenceTokens({
  //       __veColor: tokens.color("#000000"),
  //       __veFontFamily: tokens.fontFamily("Arial"),
  //       color: { black: tokens.color("#000000") },
  //     });
  //     const system = defineSystemTokens({
  //       colors: { surface: ref.color.black },
  //       spacing: tokens.dimensionScale({ 0: "0px", 1: "4px" }),
  //     });
  //     const config = defineConfig({
  //       tokens: { ref, system, components: {} },
  //     });
  //     const output: VanillaExtractPluginOptions = {
  //       outDir: "dist-test",
  //       builtInComponents: {
  //         Stack: { spacing: system.spacing },
  //       },
  //       focusRingColor: ref.__veColor,
  //       fontFamily: ref.__veFontFamily,
  //       placeholderColor: ref.__veColor,
  //     };
  //     const files = generate({ config, output });
  //     const styles = files.find((file) => file.filename === "components/stack/Stack.gen.css.ts")!;
  //     const component = files.find((file) => file.filename === "components/stack/Stack.gen.tsx")!;
  //
  //     expect(styles.content).toContain(
  //       'import { style, styleVariants } from "@vanilla-extract/css";',
  //     );
  //     expect(styles.content).toContain("systemSpacing");
  //     expect(styles.content).toMatch(/export const stackGap = styleVariants\(systemSpacing,/);
  //
  //     expect(component.content).toContain("export function Stack(");
  //     expect(component.content).toMatch(/gap\?: StackSpacingToken/);
  //   });
  //
  //   test("a wrong-typed scale binding throws MissingDesignTokensError", () => {
  //     const ref = defineReferenceTokens({
  //       __veColor: tokens.color("#000000"),
  //       __veFontFamily: tokens.fontFamily("Arial"),
  //       color: { black: tokens.color("#000000") },
  //     });
  //     const system = defineSystemTokens({
  //       colors: { surface: ref.color.black },
  //       wrongScale: tokens.colorScale({ 0: ref.color.black }),
  //     });
  //     const config = defineConfig({
  //       tokens: { ref, system, components: {} },
  //     });
  //     const output: VanillaExtractPluginOptions = {
  //       outDir: "dist-test",
  //       builtInComponents: {
  //         Stack: { spacing: system.wrongScale },
  //       } as never,
  //       focusRingColor: ref.__veColor,
  //       fontFamily: ref.__veFontFamily,
  //       placeholderColor: ref.__veColor,
  //     };
  //     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
  //     expect(() => generate({ config, output })).toThrow(/must be a dimension TokenScale/);
  //   });
  //
  //   test("missing tokens throw MissingDesignTokensError", () => {
  //     const ref = defineReferenceTokens({
  //       __veColor: tokens.color("#000000"),
  //       __veFontFamily: tokens.fontFamily("Arial"),
  //       color: { black: tokens.color("#000000") },
  //     });
  //     const config = defineConfig({
  //       tokens: { ref, system: defineSystemTokens({}), components: {} },
  //     });
  //     const output: VanillaExtractPluginOptions = {
  //       outDir: "dist-test",
  //       builtInComponents: { Stack: {} } as never,
  //       focusRingColor: ref.__veColor,
  //       fontFamily: ref.__veFontFamily,
  //       placeholderColor: ref.__veColor,
  //     };
  //     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
  //   });

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

describe("breakpoints", () => {
  function baseConfig(breakpoints?: ScaleBinding<"dimension">) {
    const ref = defineReferenceTokens({
      __veColor: tokens.color("#000000"),
      __veFontFamily: tokens.fontFamily("Arial"),
    });
    const system = defineSystemTokens({
      spacing: tokens.dimensionScale({ 0: "0px", 1: "4px", 2: "8px" }),
    });
    const config = defineConfig({
      tokens: { ref, system, components: {} },
    });
    const output: VanillaExtractPluginOptions = {
      outDir: "dist-test",
      ...(breakpoints ? { breakpoints } : {}),
      // builtInComponents: { Grid: { spacing: system.spacing } },
      focusRingColor: ref.__veColor,
      fontFamily: ref.__veFontFamily,
      placeholderColor: ref.__veColor,
    };
    return { config, output };
  }

  // TODO(built-in components): re-enable with the feature.
  //   test("omitting breakpoints keeps output byte-identical to before responsive support existed", () => {
  //     const withoutBreakpoints = generate(baseConfig());
  //     const filenames = withoutBreakpoints.map((file) => file.filename);
  //     expect(filenames).not.toContain("responsive.gen.ts");
  //     expect(filenames).not.toContain("useBreakpoint.gen.ts");
  //
  //     const gridComponent = withoutBreakpoints.find(
  //       (file) => file.filename === "components/grid/Grid.gen.tsx",
  //     )!;
  //     expect(gridComponent.content).toMatch(/columns\?: number \| string;/);
  //     expect(gridComponent.content).not.toMatch(/Responsive</);
  //   });

  test("configuring breakpoints emits useBreakpoint.gen.ts", () => {
    const breakpoints = tokens.dimensionScale({ base: "0px", md: "48rem" });
    const files = generate(baseConfig(breakpoints));
    const filenames = files.map((file) => file.filename);
    // expect(filenames).toContain("responsive.gen.ts");
    expect(filenames).toContain("useBreakpoint.gen.ts");

    // const responsive = files.find((file) => file.filename === "responsive.gen.ts")!;
    // expect(responsive.content).toMatch(/export type Breakpoint = "base" \| "md";/);

    const useBreakpoint = files.find((file) => file.filename === "useBreakpoint.gen.ts")!;
    expect(useBreakpoint.content).toMatch(/screen and \(min-width: 48rem\)/);
  });

  // TODO(built-in components): re-enable with the feature.
  //   test("Grid.gen.css.ts emits an ascending fallback chain through every lower breakpoint", () => {
  //     const breakpoints = tokens.dimensionScale({ base: "0px", md: "48rem", lg: "80rem" });
  //     const files = generate(baseConfig(breakpoints));
  //     const styles = files.find((file) => file.filename === "components/grid/Grid.gen.css.ts")!;
  //     expect(styles.content).toMatch(/gap: "var\(--rc-grid-gap-base\)",/);
  //     expect(styles.content).toMatch(/gap: "var\(--rc-grid-gap-md, var\(--rc-grid-gap-base\)\)",/);
  //     expect(styles.content).toMatch(
  //       /gap: "var\(--rc-grid-gap-lg, var\(--rc-grid-gap-md, var\(--rc-grid-gap-base\)\)\)",/,
  //     );
  //     assertParses(styles.content, "components/grid/Grid.gen.css.ts");
  //
  //     const component = files.find((file) => file.filename === "components/grid/Grid.gen.tsx")!;
  //     expect(component.content).toMatch(/columns\?: Responsive<number \| string>;/);
  //     assertParses(component.content, "components/grid/Grid.gen.tsx");
  //   });

  test("a non-dimension breakpoints scale throws", () => {
    const config = baseConfig(tokens.colorScale({ base: "#000000" }) as never);
    expect(() => generate(config)).toThrow(/breakpoints" must be a dimension TokenScale/);
  });

  test("a first breakpoint that isn't 0 throws", () => {
    const config = baseConfig(tokens.dimensionScale({ base: "1px", md: "48rem" }));
    expect(() => generate(config)).toThrow(/first entry \("base"\) must resolve to 0/);
  });

  test("non-ascending breakpoints throw", () => {
    const config = baseConfig(tokens.dimensionScale({ base: "0px", md: "80rem", lg: "48rem" }));
    expect(() => generate(config)).toThrow(/strictly ascending order/);
  });

  test("mismatched units across non-base breakpoints throw", () => {
    const config = baseConfig(tokens.dimensionScale({ base: "0px", md: "48rem", lg: "1280px" }));
    expect(() => generate(config)).toThrow(/must share the same unit/);
  });

  test("a theme-overridden breakpoint token throws", () => {
    const ref = defineReferenceTokens({
      __veColor: tokens.color("#000000"),
      __veFontFamily: tokens.fontFamily("Arial"),
      breakpoints: tokens.dimensionScale({ base: "0px", md: "48rem" }),
    });
    const system = defineSystemTokens({
      spacing: tokens.dimensionScale({ 0: "0px", 1: "4px" }),
    });
    const dark = defineTheme(ref, {
      breakpoints: tokens.dimensionScale({ base: "0px", md: "64rem" }),
    });
    const config = defineConfig({
      tokens: { ref, system, components: {} },
      themes: { dark },
    });
    const output: VanillaExtractPluginOptions = {
      outDir: "dist-test",
      breakpoints: ref.breakpoints,
      // builtInComponents: { Grid: { spacing: system.spacing } },
      focusRingColor: ref.__veColor,
      fontFamily: ref.__veFontFamily,
      placeholderColor: ref.__veColor,
    };
    expect(() => generate({ config, output })).toThrow(/cannot be overridden by theme "dark"/);
  });
});

// TODO(built-in components): re-enable with the feature.
// describe("Grid, Text, Icon built-in components", () => {
//   function gridTextIconConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000") },
//     });
//     const system = defineSystemTokens({
//       spacing: tokens.dimensionScale({ 0: "0px", 1: "4px" }),
//       textColors: tokens.colorScale({ primary: ref.color.black }),
//       textStyles: tokens.typographyScale({
//         body: { fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" },
//       }),
//       iconSizes: tokens.dimensionScale({ sm: "12px", lg: "24px" }),
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Grid: { spacing: system.spacing },
//         Text: { typography: system.textStyles, color: system.textColors },
//         Icon: { size: system.iconSizes, color: system.textColors },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Grid emits Grid.gen.css.ts and Grid.gen.tsx", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const system = defineSystemTokens({
//       spacing: tokens.dimensionScale({ 0: "0px", 1: "4px" }),
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Grid: { spacing: system.spacing } },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     const files = generate({ config, output });
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/grid/Grid.gen.css.ts");
//     expect(filenames).toContain("components/grid/Grid.gen.tsx");
//     expect(filenames).not.toContain("iconMap.tsx");
//   });
//
//   test("selecting Text emits Text.gen.css.ts and Text.gen.tsx", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000") },
//     });
//     const system = defineSystemTokens({
//       textColors: tokens.colorScale({ primary: ref.color.black }),
//       textStyles: tokens.typographyScale({
//         body: { fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" },
//       }),
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Text: { typography: system.textStyles, color: system.textColors },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     const files = generate({ config, output });
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/text/Text.gen.css.ts");
//     expect(filenames).toContain("components/text/Text.gen.tsx");
//   });
//
//   test("selecting Icon emits Icon.gen.css.ts, Icon.gen.tsx, and iconMap.tsx with writeMode once", () => {
//     const config = gridTextIconConfig();
//     const files = generate(config);
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/icon/Icon.gen.css.ts");
//     expect(filenames).toContain("components/icon/Icon.gen.tsx");
//     expect(filenames).toContain("iconMap.tsx");
//
//     const iconMap = files.find((file) => file.filename === "iconMap.tsx")!;
//     expect(iconMap.writeMode).toBe("once");
//     expect(iconMap.content).toMatch(/export const icons = \{/);
//     expect(iconMap.content).toMatch(/export type IconType = keyof typeof icons;/);
//   });
//
//   test("Grid, Text and Icon together still emit exactly one renderElement.gen.tsx and one iconMap.tsx", () => {
//     const config = gridTextIconConfig();
//     const files = generate(config);
//     expect(files.filter((file) => file.filename === "renderElement.gen.tsx").length).toBe(1);
//     expect(files.filter((file) => file.filename === "iconMap.tsx").length).toBe(1);
//   });
//
//   test("a wrong-typed Grid spacing binding throws MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000") },
//     });
//     const system = defineSystemTokens({
//       wrongScale: tokens.colorScale({ 0: ref.color.black }),
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Grid: { spacing: system.wrongScale } } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/must be a dimension TokenScale/);
//   });
//
//   test("missing Icon bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Icon: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//   });
//
//   test("Text.gen.tsx/Icon.gen.tsx/Grid.gen.tsx reference the resolved bindings", () => {
//     const config = gridTextIconConfig();
//     const files = generate(config);
//
//     const gridComponent = files.find((file) => file.filename === "components/grid/Grid.gen.tsx")!;
//     expect(gridComponent.content).toMatch(/gap\?: GridSpacingToken/);
//
//     const textStyles = files.find((file) => file.filename === "components/text/Text.gen.css.ts")!;
//     expect(textStyles.content).toMatch(
//       /export const textVariant = styleVariants\(systemTextStyles,/,
//     );
//
//     const iconComponent = files.find((file) => file.filename === "components/icon/Icon.gen.tsx")!;
//     expect(iconComponent.content).toContain(
//       'import { icons, type IconType } from "../../iconMap";',
//     );
//   });
//
//   test("every Grid/Text/Icon generated source passes assertParses", () => {
//     const config = gridTextIconConfig();
//     const files = generate(config);
//     for (const suffix of [
//       "components/grid/Grid.gen.css.ts",
//       "components/grid/Grid.gen.tsx",
//       "components/text/Text.gen.css.ts",
//       "components/text/Text.gen.tsx",
//       "components/icon/Icon.gen.css.ts",
//       "components/icon/Icon.gen.tsx",
//       "iconMap.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Button built-in component", () => {
//   function buttonConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { element: tokens.dimension("8px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//       },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Button: {
//           borderRadius: system.radius.element,
//           variants: {
//             primary: {
//               backgroundColor: ref.color.black,
//               color: ref.color.white,
//               typography: system.textStyles.body,
//               border: system.border.default,
//               hoverBackgroundColor: ref.color.black,
//               hoverColor: ref.color.white,
//               hoverBorder: system.border.default,
//               disabledBackgroundColor: ref.color.black,
//               disabledColor: ref.color.white,
//               disabledBorder: system.border.default,
//             },
//           },
//           sizes: {
//             md: {
//               horizontalSpacing: system.spacing.md,
//               verticalSpacing: system.spacing.sm,
//               typography: system.textStyles.body,
//               gap: system.spacing.sm,
//             },
//           },
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Button emits Button.gen.css.ts and Button.gen.tsx", () => {
//     const files = generate(buttonConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/button/Button.gen.css.ts");
//     expect(filenames).toContain("components/button/Button.gen.tsx");
//   });
//
//   test("variant and size keys become literal union types and styleVariants keys", () => {
//     const files = generate(buttonConfig());
//     const component = files.find((f) => f.filename === "components/button/Button.gen.tsx")!;
//     expect(component.content).toMatch(/export type ButtonVariant = "primary";/);
//     expect(component.content).toMatch(/export type ButtonSize = "md";/);
//
//     const styles = files.find((f) => f.filename === "components/button/Button.gen.css.ts")!;
//     expect(styles.content).toMatch(/"primary":\s*\{/);
//     expect(styles.content).toMatch(/"md":\s*\{/);
//   });
//
//   test("missing Button bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Button: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "borderRadius"/);
//   });
//
//   test("Button generated sources pass assertParses", () => {
//     const files = generate(buttonConfig());
//     for (const suffix of [
//       "components/button/Button.gen.css.ts",
//       "components/button/Button.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Avatar built-in component", () => {
//   function avatarConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//       sizeScale: tokens.dimensionScale({ sm: "24px", md: "32px" }),
//     });
//     const system = defineSystemTokens({
//       radius: { element: tokens.dimension("8px") },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Avatar: {
//           sizes: ref.sizeScale,
//           color: ref.color.white,
//           backgroundColor: ref.color.black,
//           borderRadius: system.radius.element,
//           typography: system.textStyles.body,
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Avatar emits Avatar.gen.css.ts and Avatar.gen.tsx", () => {
//     const files = generate(avatarConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/avatar/Avatar.gen.css.ts");
//     expect(filenames).toContain("components/avatar/Avatar.gen.tsx");
//   });
//
//   test("size scale keys become a literal union type and a styleVariants map", () => {
//     const files = generate(avatarConfig());
//     const component = files.find((f) => f.filename === "components/avatar/Avatar.gen.tsx")!;
//     expect(component.content).toMatch(/import type \{ RefSizeScale as AvatarSizeToken \}/);
//     expect(component.content).toMatch(/size\?: AvatarSizeToken/);
//
//     const styles = files.find((f) => f.filename === "components/avatar/Avatar.gen.css.ts")!;
//     expect(styles.content).toMatch(/export const avatarSize = styleVariants\(refSizeScale,/);
//   });
//
//   test("missing Avatar bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Avatar: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "sizes"/);
//   });
//
//   test("Avatar generated sources pass assertParses", () => {
//     const files = generate(avatarConfig());
//     for (const suffix of [
//       "components/avatar/Avatar.gen.css.ts",
//       "components/avatar/Avatar.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("QuoteBlock built-in component", () => {
//   function quoteBlockConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), gray: tokens.color("#666666") },
//     });
//     const system = defineSystemTokens({
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//         supporting: tokens.typography({
//           fontFamily: "Arial",
//           fontSize: "12px",
//           fontWeight: "regular",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         QuoteBlock: {
//           color: ref.color.black,
//           typography: system.textStyles.body,
//           citationColor: ref.color.gray,
//           citationTypography: system.textStyles.supporting,
//           border: system.border.default,
//           horizontalSpacing: system.spacing.md,
//           verticalSpacing: system.spacing.sm,
//           gap: system.spacing.sm,
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting QuoteBlock emits QuoteBlock.gen.css.ts and QuoteBlock.gen.tsx", () => {
//     const files = generate(quoteBlockConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/quote-block/QuoteBlock.gen.css.ts");
//     expect(filenames).toContain("components/quote-block/QuoteBlock.gen.tsx");
//   });
//
//   test("QuoteBlock.gen.tsx renders a figure with a blockquote and optional figcaption", () => {
//     const files = generate(quoteBlockConfig());
//     const component = files.find(
//       (f) => f.filename === "components/quote-block/QuoteBlock.gen.tsx",
//     )!;
//     expect(component.content).toMatch(/<blockquote className={quoteBlockQuote}>/);
//     expect(component.content).toMatch(/<figcaption className={quoteBlockCitation}>/);
//     expect(component.content).toMatch(/renderElement\("figure", render, rootProps/);
//   });
//
//   test("missing QuoteBlock bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { QuoteBlock: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "color"/);
//   });
//
//   test("QuoteBlock generated sources pass assertParses", () => {
//     const files = generate(quoteBlockConfig());
//     for (const suffix of [
//       "components/quote-block/QuoteBlock.gen.css.ts",
//       "components/quote-block/QuoteBlock.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Code built-in component", () => {
//   function codeConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), gray: tokens.color("#eeeeee") },
//     });
//     const system = defineSystemTokens({
//       spacing: { sm: tokens.dimension("2px"), md: tokens.dimension("4px") },
//       radius: { inner: tokens.dimension("4px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       textStyles: {
//         code: tokens.typography({
//           fontFamily: "monospace",
//           fontSize: "12px",
//           fontWeight: "regular",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Code: {
//           color: ref.color.black,
//           backgroundColor: ref.color.gray,
//           border: system.border.default,
//           borderRadius: system.radius.inner,
//           typography: system.textStyles.code,
//           horizontalSpacing: system.spacing.md,
//           verticalSpacing: system.spacing.sm,
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Code emits Code.gen.css.ts and Code.gen.tsx", () => {
//     const files = generate(codeConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/code/Code.gen.css.ts");
//     expect(filenames).toContain("components/code/Code.gen.tsx");
//   });
//
//   test("Code.gen.css.ts references every resolved binding", () => {
//     const files = generate(codeConfig());
//     const styles = files.find((f) => f.filename === "components/code/Code.gen.css.ts")!;
//     expect(styles.content).toMatch(/color: vars\.ref\.color\.black/);
//     expect(styles.content).toMatch(/backgroundColor: vars\.ref\.color\.gray/);
//   });
//
//   test("missing Code bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Code: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "color"/);
//   });
//
//   test("Code generated sources pass assertParses", () => {
//     const files = generate(codeConfig());
//     for (const suffix of ["components/code/Code.gen.css.ts", "components/code/Code.gen.tsx"]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("KeyboardShortcut built-in component", () => {
//   function keyboardShortcutConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), gray: tokens.color("#eeeeee") },
//     });
//     const system = defineSystemTokens({
//       spacing: { xs: tokens.dimension("2px"), sm: tokens.dimension("4px") },
//       radius: { inner: tokens.dimension("4px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       textStyles: {
//         code: tokens.typography({
//           fontFamily: "monospace",
//           fontSize: "12px",
//           fontWeight: "regular",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         KeyboardShortcut: {
//           color: ref.color.black,
//           backgroundColor: ref.color.gray,
//           border: system.border.default,
//           borderRadius: system.radius.inner,
//           typography: system.textStyles.code,
//           horizontalSpacing: system.spacing.sm,
//           verticalSpacing: system.spacing.xs,
//           gap: system.spacing.xs,
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting KeyboardShortcut emits KeyboardShortcut.gen.css.ts and KeyboardShortcut.gen.tsx", () => {
//     const files = generate(keyboardShortcutConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/keyboard-shortcut/KeyboardShortcut.gen.css.ts");
//     expect(filenames).toContain("components/keyboard-shortcut/KeyboardShortcut.gen.tsx");
//   });
//
//   test("KeyboardShortcut.gen.tsx renders one <kbd> per key with an optional separator", () => {
//     const files = generate(keyboardShortcutConfig());
//     const component = files.find(
//       (f) => f.filename === "components/keyboard-shortcut/KeyboardShortcut.gen.tsx",
//     )!;
//     expect(component.content).toMatch(/<kbd className={keyboardShortcutKey}>{key}<\/kbd>/);
//     expect(component.content).toMatch(/keys\.map\(\(key, index\)/);
//   });
//
//   test("missing KeyboardShortcut bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { KeyboardShortcut: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "color"/);
//   });
//
//   test("KeyboardShortcut generated sources pass assertParses", () => {
//     const files = generate(keyboardShortcutConfig());
//     for (const suffix of [
//       "components/keyboard-shortcut/KeyboardShortcut.gen.css.ts",
//       "components/keyboard-shortcut/KeyboardShortcut.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Divider built-in component", () => {
//   function dividerConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), gray: tokens.color("#cccccc") },
//     });
//     const system = defineSystemTokens({
//       spacing: { sm: tokens.dimension("8px") },
//       radius: { none: tokens.dimension("0px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Divider: {
//           border: system.border.default,
//           borderRadius: system.radius.none,
//           color: ref.color.gray,
//           spacing: system.spacing.sm,
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Divider emits Divider.gen.css.ts and Divider.gen.tsx", () => {
//     const files = generate(dividerConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/divider/Divider.gen.css.ts");
//     expect(filenames).toContain("components/divider/Divider.gen.tsx");
//   });
//
//   test("Divider.gen.tsx wraps Base UI's Separator and forwards orientation/render", () => {
//     const files = generate(dividerConfig());
//     const component = files.find((f) => f.filename === "components/divider/Divider.gen.tsx")!;
//     expect(component.content).toMatch(
//       /import { Separator as BaseSeparator } from "@base-ui\/react\/separator";/,
//     );
//     expect(component.content).toMatch(/orientation={orientation}/);
//     expect(component.content).toMatch(/render={render}/);
//   });
//
//   test("missing Divider bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Divider: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "border"/);
//   });
//
//   test("Divider generated sources pass assertParses", () => {
//     const files = generate(dividerConfig());
//     for (const suffix of [
//       "components/divider/Divider.gen.css.ts",
//       "components/divider/Divider.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Collapsible built-in component", () => {
//   function collapsibleConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       radius: { element: tokens.dimension("8px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//       },
//       transitions: {
//         standard: tokens.transition({ duration: "150ms", timingFunction: [0.24, 1, 0.4, 1] }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Collapsible: {
//           borderRadius: system.radius.element,
//           border: system.border.default,
//           backgroundColor: ref.color.white,
//           hoverBackgroundColor: ref.color.white,
//           triggerHorizontalSpacing: system.spacing.md,
//           triggerVerticalSpacing: system.spacing.sm,
//           triggerTypography: system.textStyles.body,
//           triggerColor: ref.color.black,
//           contentHorizontalSpacing: system.spacing.md,
//           contentVerticalSpacing: system.spacing.sm,
//           transition: system.transitions.standard,
//           indicatorIcon: "chevronDown",
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Collapsible emits Collapsible.gen.css.ts and Collapsible.gen.tsx", () => {
//     const files = generate(collapsibleConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/collapsible/Collapsible.gen.css.ts");
//     expect(filenames).toContain("components/collapsible/Collapsible.gen.tsx");
//   });
//
//   test("Collapsible.gen.tsx wraps Base UI's Collapsible and bakes in an indicator icon", () => {
//     const files = generate(collapsibleConfig());
//     const component = files.find(
//       (f) => f.filename === "components/collapsible/Collapsible.gen.tsx",
//     )!;
//     expect(component.content).toMatch(
//       /import { Collapsible as BaseCollapsible } from "@base-ui\/react\/collapsible";/,
//     );
//     expect(component.content).toMatch(/const IndicatorIcon = icons\["chevronDown"\];/);
//
//     const styles = files.find(
//       (f) => f.filename === "components/collapsible/Collapsible.gen.css.ts",
//     )!;
//     expect(styles.content).toMatch(/"\[data-panel-open\] &": \{ transform: "rotate\(180deg\)" \}/);
//   });
//
//   test("missing Collapsible bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Collapsible: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "borderRadius"/);
//   });
//
//   test("Collapsible generated sources pass assertParses", () => {
//     const files = generate(collapsibleConfig());
//     for (const suffix of [
//       "components/collapsible/Collapsible.gen.css.ts",
//       "components/collapsible/Collapsible.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Accordion built-in component", () => {
//   function accordionConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       radius: { element: tokens.dimension("8px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//       },
//       transitions: {
//         standard: tokens.transition({ duration: "150ms", timingFunction: [0.24, 1, 0.4, 1] }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Accordion: {
//           border: system.border.default,
//           borderRadius: system.radius.element,
//           hoverBackgroundColor: ref.color.white,
//           triggerHorizontalSpacing: system.spacing.md,
//           triggerVerticalSpacing: system.spacing.sm,
//           triggerTypography: system.textStyles.body,
//           triggerColor: ref.color.black,
//           contentHorizontalSpacing: system.spacing.md,
//           contentVerticalSpacing: system.spacing.sm,
//           transition: system.transitions.standard,
//           indicatorIcon: "chevronDown",
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Accordion emits Accordion.gen.css.ts and Accordion.gen.tsx", () => {
//     const files = generate(accordionConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/accordion/Accordion.gen.css.ts");
//     expect(filenames).toContain("components/accordion/Accordion.gen.tsx");
//   });
//
//   test("Accordion.gen.tsx wraps Base UI's Accordion and maps items to Accordion.Item", () => {
//     const files = generate(accordionConfig());
//     const component = files.find((f) => f.filename === "components/accordion/Accordion.gen.tsx")!;
//     expect(component.content).toMatch(
//       /import { Accordion as BaseAccordion } from "@base-ui\/react\/accordion";/,
//     );
//     expect(component.content).toMatch(/items\.map\(\(item\) =>/);
//     expect(component.content).toMatch(/const IndicatorIcon = icons\["chevronDown"\];/);
//   });
//
//   test("missing Accordion bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Accordion: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "border"/);
//   });
//
//   test("Accordion generated sources pass assertParses", () => {
//     const files = generate(accordionConfig());
//     for (const suffix of [
//       "components/accordion/Accordion.gen.css.ts",
//       "components/accordion/Accordion.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Link built-in component", () => {
//   function linkConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), blue: tokens.color("#0064e0") },
//     });
//     const system = defineSystemTokens({
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Link: {
//           color: ref.color.blue,
//           hoverColor: ref.color.black,
//           typography: system.textStyles.body,
//           visitedColor: ref.color.blue,
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Link emits Link.gen.css.ts and Link.gen.tsx", () => {
//     const files = generate(linkConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/link/Link.gen.css.ts");
//     expect(filenames).toContain("components/link/Link.gen.tsx");
//   });
//
//   test("Link.gen.tsx renders an anchor through renderElement with underline variants", () => {
//     const files = generate(linkConfig());
//     const component = files.find((f) => f.filename === "components/link/Link.gen.tsx")!;
//     expect(component.content).toMatch(/renderElement\("a", render, rootProps/);
//     expect(component.content).toMatch(/underline\?: "always" \| "hover" \| "none"/);
//
//     const styles = files.find((f) => f.filename === "components/link/Link.gen.css.ts")!;
//     expect(styles.content).toMatch(/always:\s*\{/);
//     expect(styles.content).toMatch(/hover:\s*\{/);
//     expect(styles.content).toMatch(/none:\s*\{/);
//   });
//
//   test("missing Link bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Link: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "color"/);
//   });
//
//   test("Link generated sources pass assertParses", () => {
//     const files = generate(linkConfig());
//     for (const suffix of ["components/link/Link.gen.css.ts", "components/link/Link.gen.tsx"]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("IconButton built-in component", () => {
//   function iconButtonConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { element: tokens.dimension("8px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//       },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         IconButton: {
//           borderRadius: system.radius.element,
//           variants: {
//             primary: {
//               backgroundColor: ref.color.black,
//               color: ref.color.white,
//               typography: system.textStyles.body,
//               border: system.border.default,
//               hoverBackgroundColor: ref.color.black,
//               hoverColor: ref.color.white,
//               hoverBorder: system.border.default,
//               disabledBackgroundColor: ref.color.black,
//               disabledColor: ref.color.white,
//               disabledBorder: system.border.default,
//             },
//           },
//           sizes: {
//             md: {
//               horizontalSpacing: system.spacing.md,
//               verticalSpacing: system.spacing.sm,
//               iconSize: system.spacing.md,
//             },
//           },
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting IconButton emits IconButton.gen.css.ts and IconButton.gen.tsx", () => {
//     const files = generate(iconButtonConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/icon-button/IconButton.gen.css.ts");
//     expect(filenames).toContain("components/icon-button/IconButton.gen.tsx");
//   });
//
//   test("variant and size keys become literal union types, label is mandatory", () => {
//     const files = generate(iconButtonConfig());
//     const component = files.find(
//       (f) => f.filename === "components/icon-button/IconButton.gen.tsx",
//     )!;
//     expect(component.content).toMatch(/export type IconButtonVariant = "primary";/);
//     expect(component.content).toMatch(/export type IconButtonSize = "md";/);
//     expect(component.content).toMatch(/label: string;/);
//     expect(component.content).toMatch(/aria-label={label}/);
//
//     const styles = files.find(
//       (f) => f.filename === "components/icon-button/IconButton.gen.css.ts",
//     )!;
//     expect(styles.content).toMatch(/"primary":\s*\{/);
//     expect(styles.content).toMatch(/"md":\s*\{/);
//   });
//
//   test("missing IconButton bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { IconButton: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "borderRadius"/);
//   });
//
//   test("IconButton generated sources pass assertParses", () => {
//     const files = generate(iconButtonConfig());
//     for (const suffix of [
//       "components/icon-button/IconButton.gen.css.ts",
//       "components/icon-button/IconButton.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("DropdownButton built-in component", () => {
//   function dropdownButtonConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { element: tokens.dimension("8px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//       },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       elevation: {
//         md: tokens.shadow({
//           color: ref.color.black,
//           offsetX: "0px",
//           offsetY: "2px",
//           blur: "4px",
//           spread: "0px",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         DropdownButton: {
//           borderRadius: system.radius.element,
//           variants: {
//             primary: {
//               backgroundColor: ref.color.black,
//               color: ref.color.white,
//               typography: system.textStyles.body,
//               border: system.border.default,
//               hoverBackgroundColor: ref.color.black,
//               hoverColor: ref.color.white,
//               hoverBorder: system.border.default,
//               disabledBackgroundColor: ref.color.black,
//               disabledColor: ref.color.white,
//               disabledBorder: system.border.default,
//             },
//           },
//           sizes: {
//             md: {
//               horizontalSpacing: system.spacing.md,
//               verticalSpacing: system.spacing.sm,
//               typography: system.textStyles.body,
//               gap: system.spacing.sm,
//             },
//           },
//           popupBackgroundColor: ref.color.white,
//           popupBorder: system.border.default,
//           popupBorderRadius: system.radius.element,
//           popupShadow: system.elevation.md,
//           popupSpacing: system.spacing.sm,
//           popupOffset: system.spacing.sm,
//           itemColor: ref.color.black,
//           itemTypography: system.textStyles.body,
//           itemHoverBackgroundColor: ref.color.white,
//           itemDisabledColor: ref.color.black,
//           itemHorizontalSpacing: system.spacing.md,
//           itemVerticalSpacing: system.spacing.sm,
//           itemIconSize: system.spacing.md,
//           indicatorIcon: "chevronDown",
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting DropdownButton emits DropdownButton.gen.css.ts and DropdownButton.gen.tsx", () => {
//     const files = generate(dropdownButtonConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/dropdown-button/DropdownButton.gen.css.ts");
//     expect(filenames).toContain("components/dropdown-button/DropdownButton.gen.tsx");
//   });
//
//   test("DropdownButton.gen.tsx wraps Base UI's Menu and maps items to Menu.Item", () => {
//     const files = generate(dropdownButtonConfig());
//     const component = files.find(
//       (f) => f.filename === "components/dropdown-button/DropdownButton.gen.tsx",
//     )!;
//     expect(component.content).toMatch(/import { Menu as BaseMenu } from "@base-ui\/react\/menu";/);
//     expect(component.content).toMatch(/items\.map\(\(item\) =>/);
//     expect(component.content).toMatch(/const IndicatorIcon = icons\["chevronDown"\];/);
//     expect(component.content).toMatch(/export type DropdownButtonVariant = "primary";/);
//   });
//
//   test("missing DropdownButton bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { DropdownButton: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "borderRadius"/);
//   });
//
//   test("DropdownButton generated sources pass assertParses", () => {
//     const files = generate(dropdownButtonConfig());
//     for (const suffix of [
//       "components/dropdown-button/DropdownButton.gen.css.ts",
//       "components/dropdown-button/DropdownButton.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("SegmentedControls built-in component", () => {
//   function segmentedControlsConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { element: tokens.dimension("8px"), inner: tokens.dimension("4px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//       },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         SegmentedControls: {
//           borderRadius: system.radius.element,
//           optionBorderRadius: system.radius.inner,
//           border: system.border.default,
//           borderColor: ref.color.black,
//           typography: system.textStyles.body,
//           color: ref.color.black,
//           backgroundColor: ref.color.white,
//           hoverColor: ref.color.black,
//           activeColor: ref.color.white,
//           activeBackgroundColor: ref.color.black,
//           disabledColor: ref.color.black,
//           horizontalSpacing: system.spacing.sm,
//           verticalSpacing: system.spacing.sm,
//           optionHorizontalSpacing: system.spacing.md,
//           optionVerticalSpacing: system.spacing.sm,
//           optionGap: system.spacing.sm,
//           iconSize: system.spacing.md,
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting SegmentedControls emits SegmentedControls.gen.css.ts and SegmentedControls.gen.tsx", () => {
//     const files = generate(segmentedControlsConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/segmented-controls/SegmentedControls.gen.css.ts");
//     expect(filenames).toContain("components/segmented-controls/SegmentedControls.gen.tsx");
//   });
//
//   test("SegmentedControls.gen.tsx wraps Base UI's ToggleGroup/Toggle as a single-select group", () => {
//     const files = generate(segmentedControlsConfig());
//     const component = files.find(
//       (f) => f.filename === "components/segmented-controls/SegmentedControls.gen.tsx",
//     )!;
//     expect(component.content).toMatch(
//       /import { ToggleGroup as BaseToggleGroup } from "@base-ui\/react\/toggle-group";/,
//     );
//     expect(component.content).toMatch(
//       /import { Toggle as BaseToggle } from "@base-ui\/react\/toggle";/,
//     );
//     expect(component.content).toMatch(/multiple={false}/);
//     expect(component.content).toMatch(/options\.map\(\(option\) =>/);
//   });
//
//   test("missing SegmentedControls bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { SegmentedControls: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "borderRadius"/);
//   });
//
//   test("SegmentedControls generated sources pass assertParses", () => {
//     const files = generate(segmentedControlsConfig());
//     for (const suffix of [
//       "components/segmented-controls/SegmentedControls.gen.css.ts",
//       "components/segmented-controls/SegmentedControls.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("SelectableCard built-in component", () => {
//   function selectableCardConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { container: tokens.dimension("12px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         SelectableCard: {
//           borderRadius: system.radius.container,
//           border: system.border.default,
//           backgroundColor: ref.color.white,
//           activeBackgroundColor: ref.color.white,
//           activeBorderColor: ref.color.black,
//           hoverBorderColor: ref.color.black,
//           disabledBackgroundColor: ref.color.white,
//           disabledColor: ref.color.black,
//           horizontalSpacing: system.spacing.md,
//           verticalSpacing: system.spacing.sm,
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting SelectableCard emits SelectableCard.gen.css.ts and SelectableCard.gen.tsx", () => {
//     const files = generate(selectableCardConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/selectable-card/SelectableCard.gen.css.ts");
//     expect(filenames).toContain("components/selectable-card/SelectableCard.gen.tsx");
//   });
//
//   test("SelectableCard.gen.tsx manages controlled/uncontrolled selection with radio/checkbox roles", () => {
//     const files = generate(selectableCardConfig());
//     const component = files.find(
//       (f) => f.filename === "components/selectable-card/SelectableCard.gen.tsx",
//     )!;
//     expect(component.content).toMatch(/const \[uncontrolledSelected, setUncontrolledSelected\]/);
//     expect(component.content).toMatch(/role: control === "radio" \? "radio" : "checkbox"/);
//     expect(component.content).toMatch(/renderElement\("button", render, rootProps/);
//   });
//
//   test("missing SelectableCard bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { SelectableCard: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "borderRadius"/);
//   });
//
//   test("SelectableCard generated sources pass assertParses", () => {
//     const files = generate(selectableCardConfig());
//     for (const suffix of [
//       "components/selectable-card/SelectableCard.gen.css.ts",
//       "components/selectable-card/SelectableCard.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("ActionBar built-in component", () => {
//   function actionBarConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { container: tokens.dimension("12px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       elevation: {
//         md: tokens.shadow({
//           color: ref.color.black,
//           offsetX: "0px",
//           offsetY: "2px",
//           blur: "4px",
//           spread: "0px",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         ActionBar: {
//           backgroundColor: ref.color.white,
//           color: ref.color.black,
//           border: system.border.default,
//           borderRadius: system.radius.container,
//           shadow: system.elevation.md,
//           horizontalSpacing: system.spacing.md,
//           verticalSpacing: system.spacing.sm,
//           gap: system.spacing.sm,
//           offset: system.spacing.md,
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting ActionBar emits ActionBar.gen.css.ts and ActionBar.gen.tsx", () => {
//     const files = generate(actionBarConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/action-bar/ActionBar.gen.css.ts");
//     expect(filenames).toContain("components/action-bar/ActionBar.gen.tsx");
//   });
//
//   test("ActionBar.gen.tsx wraps Base UI's Toolbar and hides via CSS instead of unmounting", () => {
//     const files = generate(actionBarConfig());
//     const component = files.find((f) => f.filename === "components/action-bar/ActionBar.gen.tsx")!;
//     expect(component.content).toMatch(
//       /import { Toolbar as BaseToolbar } from "@base-ui\/react\/toolbar";/,
//     );
//     expect(component.content).toMatch(/!open && actionBarHidden/);
//
//     const styles = files.find((f) => f.filename === "components/action-bar/ActionBar.gen.css.ts")!;
//     expect(styles.content).toMatch(/"bottom-start":\s*\{/);
//     expect(styles.content).toMatch(/"bottom-end":\s*\{/);
//   });
//
//   test("missing ActionBar bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { ActionBar: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "backgroundColor"/);
//   });
//
//   test("ActionBar generated sources pass assertParses", () => {
//     const files = generate(actionBarConfig());
//     for (const suffix of [
//       "components/action-bar/ActionBar.gen.css.ts",
//       "components/action-bar/ActionBar.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Badge built-in component", () => {
//   function badgeConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { full: tokens.dimension("9999px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { xs: tokens.dimension("2px"), sm: tokens.dimension("4px") },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "12px", fontWeight: "regular" }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Badge: {
//           borderRadius: system.radius.full,
//           statuses: {
//             info: {
//               color: ref.color.black,
//               backgroundColor: ref.color.white,
//               border: system.border.default,
//             },
//           },
//           sizes: {
//             sm: {
//               typography: system.textStyles.body,
//               horizontalSpacing: system.spacing.sm,
//               verticalSpacing: system.spacing.xs,
//               gap: system.spacing.xs,
//               iconSize: system.spacing.sm,
//             },
//           },
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Badge emits Badge.gen.css.ts and Badge.gen.tsx", () => {
//     const files = generate(badgeConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/badge/Badge.gen.css.ts");
//     expect(filenames).toContain("components/badge/Badge.gen.tsx");
//   });
//
//   test("statuses and sizes keys become literal union types, icon renders with variant color", () => {
//     const files = generate(badgeConfig());
//     const component = files.find((f) => f.filename === "components/badge/Badge.gen.tsx")!;
//     expect(component.content).toMatch(/export type BadgeStatusToken = "info";/);
//     expect(component.content).toMatch(/export type BadgeSize = "sm";/);
//     expect(component.content).not.toMatch(/dot/i);
//   });
//
//   test("missing Badge bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Badge: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "borderRadius"/);
//   });
//
//   test("Badge generated sources pass assertParses", () => {
//     const files = generate(badgeConfig());
//     for (const suffix of ["components/badge/Badge.gen.css.ts", "components/badge/Badge.gen.tsx"]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Banner built-in component", () => {
//   function bannerConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { element: tokens.dimension("8px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//         title: tokens.typography({ fontFamily: "Arial", fontSize: "16px", fontWeight: "bold" }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Banner: {
//           border: system.border.default,
//           borderRadius: system.radius.element,
//           typography: system.textStyles.body,
//           titleTypography: system.textStyles.title,
//           horizontalSpacing: system.spacing.md,
//           verticalSpacing: system.spacing.sm,
//           gap: system.spacing.sm,
//           iconSize: system.spacing.md,
//           closeIcon: "close",
//           statuses: {
//             info: {
//               color: ref.color.black,
//               backgroundColor: ref.color.white,
//               borderColor: ref.color.black,
//               iconColor: ref.color.black,
//               titleColor: ref.color.black,
//               icon: "info",
//             },
//             danger: {
//               color: ref.color.black,
//               backgroundColor: ref.color.white,
//               borderColor: ref.color.black,
//               iconColor: ref.color.black,
//               titleColor: ref.color.black,
//               icon: "alert",
//             },
//           },
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Banner emits Banner.gen.css.ts and Banner.gen.tsx", () => {
//     const files = generate(bannerConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/banner/Banner.gen.css.ts");
//     expect(filenames).toContain("components/banner/Banner.gen.tsx");
//   });
//
//   test("Banner.gen.tsx builds a per-status default icon map covering every status key", () => {
//     const files = generate(bannerConfig());
//     const component = files.find((f) => f.filename === "components/banner/Banner.gen.tsx")!;
//     expect(component.content).toMatch(/export type BannerStatusToken = "info" \| "danger";/);
//     expect(component.content).toMatch(/const STATUS_ICONS: Record<BannerStatusToken, IconType>/);
//     expect(component.content).toMatch(/"info": "info" as IconType,/);
//     expect(component.content).toMatch(/"danger": "alert" as IconType,/);
//     expect(component.content).toMatch(
//       /icon === false \? undefined : \(icon \?\? STATUS_ICONS\[status\]\)/,
//     );
//   });
//
//   test("missing Banner bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Banner: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "border"/);
//   });
//
//   test("Banner generated sources pass assertParses", () => {
//     const files = generate(bannerConfig());
//     for (const suffix of [
//       "components/banner/Banner.gen.css.ts",
//       "components/banner/Banner.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Skeleton built-in component", () => {
//   function skeletonConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//       radiusScale: tokens.dimensionScale({ sm: "4px", md: "8px" }),
//     });
//     const system = defineSystemTokens({
//       spacing: { sm: tokens.dimension("4px") },
//       radius: { full: tokens.dimension("9999px") },
//       motion: { fast: tokens.duration("150ms") },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Skeleton: {
//           backgroundColor: ref.color.black,
//           highlightColor: ref.color.white,
//           radii: ref.radiusScale,
//           circularRadius: system.radius.full,
//           lineGap: system.spacing.sm,
//           animationDuration: system.motion.fast,
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Skeleton emits Skeleton.gen.css.ts and Skeleton.gen.tsx", () => {
//     const files = generate(skeletonConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/skeleton/Skeleton.gen.css.ts");
//     expect(filenames).toContain("components/skeleton/Skeleton.gen.tsx");
//   });
//
//   test("Skeleton.gen.tsx renders stacked lines for the text variant and a shimmer keyframe", () => {
//     const files = generate(skeletonConfig());
//     const component = files.find((f) => f.filename === "components/skeleton/Skeleton.gen.tsx")!;
//     expect(component.content).toMatch(/variant === "text" && lines && lines > 1/);
//     expect(component.content).toMatch(/radius !== undefined && skeletonRadius\[radius\]/);
//
//     const styles = files.find((f) => f.filename === "components/skeleton/Skeleton.gen.css.ts")!;
//     expect(styles.content).toMatch(/const shimmer = keyframes\(/);
//     expect(styles.content).toMatch(/export const skeletonRadius = styleVariants\(/);
//   });
//
//   test("missing Skeleton bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Skeleton: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "backgroundColor"/);
//   });
//
//   test("Skeleton generated sources pass assertParses", () => {
//     const files = generate(skeletonConfig());
//     for (const suffix of [
//       "components/skeleton/Skeleton.gen.css.ts",
//       "components/skeleton/Skeleton.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Spinner built-in component", () => {
//   function spinnerConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//       fontSizeScale: tokens.dimensionScale({ sm: "12px", md: "16px" }),
//       colorScale: tokens.colorScale({ primary: tokens.color("#000000") }),
//     });
//     const system = defineSystemTokens({
//       spacing: { xs: tokens.dimension("2px") },
//       motion: { fast: tokens.duration("600ms") },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Spinner: {
//           sizes: ref.fontSizeScale,
//           colors: ref.colorScale,
//           trackColor: ref.color.white,
//           thickness: system.spacing.xs,
//           animationDuration: system.motion.fast,
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Spinner emits Spinner.gen.css.ts and Spinner.gen.tsx", () => {
//     const files = generate(spinnerConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/spinner/Spinner.gen.css.ts");
//     expect(filenames).toContain("components/spinner/Spinner.gen.tsx");
//   });
//
//   test("Spinner.gen.tsx spins via a keyframe and colors the top border per the color scale", () => {
//     const files = generate(spinnerConfig());
//     const component = files.find((f) => f.filename === "components/spinner/Spinner.gen.tsx")!;
//     expect(component.content).toMatch(/renderElement\("span", render, rootProps/);
//     expect(component.content).toMatch(
//       /typeof size === "number" \? \{ width: size, height: size \} : \{\}/,
//     );
//
//     const styles = files.find((f) => f.filename === "components/spinner/Spinner.gen.css.ts")!;
//     expect(styles.content).toMatch(/const spin = keyframes\(/);
//     expect(styles.content).toMatch(/borderTopColor: value,/);
//   });
//
//   test("missing Spinner bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Spinner: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "sizes"/);
//   });
//
//   test("Spinner generated sources pass assertParses", () => {
//     const files = generate(spinnerConfig());
//     for (const suffix of [
//       "components/spinner/Spinner.gen.css.ts",
//       "components/spinner/Spinner.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("ProgressBar built-in component", () => {
//   function progressBarConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { full: tokens.dimension("9999px") },
//       spacing: { xs: tokens.dimension("2px"), sm: tokens.dimension("4px") },
//       textStyles: {
//         supporting: tokens.typography({
//           fontFamily: "Arial",
//           fontSize: "12px",
//           fontWeight: "regular",
//         }),
//       },
//       motion: { fast: tokens.duration("600ms") },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         ProgressBar: {
//           borderRadius: system.radius.full,
//           trackBackgroundColor: ref.color.white,
//           labelTypography: system.textStyles.supporting,
//           labelGap: system.spacing.xs,
//           animationDuration: system.motion.fast,
//           statuses: {
//             default: {
//               indicatorBackgroundColor: ref.color.black,
//               labelColor: ref.color.black,
//             },
//           },
//           sizes: {
//             md: {
//               height: system.spacing.sm,
//               typography: system.textStyles.supporting,
//             },
//           },
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting ProgressBar emits ProgressBar.gen.css.ts and ProgressBar.gen.tsx", () => {
//     const files = generate(progressBarConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/progress-bar/ProgressBar.gen.css.ts");
//     expect(filenames).toContain("components/progress-bar/ProgressBar.gen.tsx");
//   });
//
//   test("ProgressBar.gen.tsx wraps Base UI's Progress and animates the indeterminate state via CSS", () => {
//     const files = generate(progressBarConfig());
//     const component = files.find(
//       (f) => f.filename === "components/progress-bar/ProgressBar.gen.tsx",
//     )!;
//     expect(component.content).toMatch(
//       /import { Progress as BaseProgress } from "@base-ui\/react\/progress";/,
//     );
//     expect(component.content).toMatch(/export type ProgressBarStatusToken = "default";/);
//
//     const styles = files.find(
//       (f) => f.filename === "components/progress-bar/ProgressBar.gen.css.ts",
//     )!;
//     expect(styles.content).toMatch(/const indeterminateSweep = keyframes\(/);
//     expect(styles.content).toMatch(/\[data-indeterminate\] &/);
//   });
//
//   test("missing ProgressBar bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { ProgressBar: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "borderRadius"/);
//   });
//
//   test("ProgressBar generated sources pass assertParses", () => {
//     const files = generate(progressBarConfig());
//     for (const suffix of [
//       "components/progress-bar/ProgressBar.gen.css.ts",
//       "components/progress-bar/ProgressBar.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Checkbox built-in component", () => {
//   function checkboxConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//       fontSizeScale: tokens.dimensionScale({ sm: "12px", md: "16px" }),
//     });
//     const system = defineSystemTokens({
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       radius: { inner: tokens.dimension("4px") },
//       spacing: { sm: tokens.dimension("4px") },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Checkbox: {
//           boxSize: ref.fontSizeScale.md,
//           labelTypography: system.textStyles.body,
//           border: system.border.default,
//           borderRadius: system.radius.inner,
//           backgroundColor: ref.color.white,
//           checkedBackgroundColor: ref.color.black,
//           checkedColor: ref.color.white,
//           hoverBorderColor: ref.color.black,
//           invalidBorderColor: ref.color.black,
//           disabledBackgroundColor: ref.color.white,
//           disabledColor: ref.color.black,
//           labelColor: ref.color.black,
//           gap: system.spacing.sm,
//           checkedIcon: "check",
//           indeterminateIcon: "close",
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Checkbox emits Checkbox.gen.css.ts and Checkbox.gen.tsx", () => {
//     const files = generate(checkboxConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/checkbox/Checkbox.gen.css.ts");
//     expect(filenames).toContain("components/checkbox/Checkbox.gen.tsx");
//   });
//
//   test("Checkbox.gen.tsx wraps Base UI's Checkbox and extends FieldableInputProps", () => {
//     const files = generate(checkboxConfig());
//     const component = files.find((f) => f.filename === "components/checkbox/Checkbox.gen.tsx")!;
//     expect(component.content).toMatch(
//       /import { Checkbox as BaseCheckbox } from "@base-ui\/react\/checkbox";/,
//     );
//     expect(component.content).toMatch(/extends CommonComponentProps, FieldableInputProps/);
//     expect(component.content).toMatch(/indeterminate \? \(/);
//     expect(component.content).toMatch(/<IndeterminateIcon className={checkboxIndicatorIcon} \/>/);
//     expect(component.content).toMatch(/<CheckedIcon className={checkboxIndicatorIcon} \/>/);
//
//     const renderElementModule = files.find((f) => f.filename === "renderElement.gen.tsx")!;
//     expect(renderElementModule.content).toMatch(/export interface FieldableInputProps/);
//   });
//
//   test("missing Checkbox bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Checkbox: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "boxSize"/);
//   });
//
//   test("Checkbox generated sources pass assertParses", () => {
//     const files = generate(checkboxConfig());
//     for (const suffix of [
//       "components/checkbox/Checkbox.gen.css.ts",
//       "components/checkbox/Checkbox.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("RadioList built-in component", () => {
//   function radioListConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//       fontSizeScale: tokens.dimensionScale({ sm: "12px", md: "16px" }),
//     });
//     const system = defineSystemTokens({
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//         supporting: tokens.typography({
//           fontFamily: "Arial",
//           fontSize: "12px",
//           fontWeight: "regular",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         RadioList: {
//           sizes: ref.fontSizeScale,
//           border: system.border.default,
//           backgroundColor: ref.color.white,
//           checkedBorderColor: ref.color.black,
//           checkedColor: ref.color.black,
//           hoverBorderColor: ref.color.black,
//           invalidBorderColor: ref.color.black,
//           disabledBackgroundColor: ref.color.white,
//           disabledColor: ref.color.black,
//           labelTypography: system.textStyles.body,
//           labelColor: ref.color.black,
//           descriptionTypography: system.textStyles.supporting,
//           descriptionColor: ref.color.black,
//           gap: system.spacing.sm,
//           optionGap: system.spacing.md,
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting RadioList emits RadioList.gen.css.ts and RadioList.gen.tsx", () => {
//     const files = generate(radioListConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/radio-list/RadioList.gen.css.ts");
//     expect(filenames).toContain("components/radio-list/RadioList.gen.tsx");
//   });
//
//   test("RadioList.gen.tsx wraps Base UI's RadioGroup/Radio and maps options", () => {
//     const files = generate(radioListConfig());
//     const component = files.find((f) => f.filename === "components/radio-list/RadioList.gen.tsx")!;
//     expect(component.content).toMatch(
//       /import { RadioGroup as BaseRadioGroup } from "@base-ui\/react\/radio-group";/,
//     );
//     expect(component.content).toMatch(
//       /import { Radio as BaseRadio } from "@base-ui\/react\/radio";/,
//     );
//     expect(component.content).toMatch(/options\.map\(\(option\) =>/);
//     expect(component.content).toMatch(/extends CommonComponentProps, FieldableInputProps/);
//   });
//
//   test("missing RadioList bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { RadioList: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "sizes"/);
//   });
//
//   test("RadioList generated sources pass assertParses", () => {
//     const files = generate(radioListConfig());
//     for (const suffix of [
//       "components/radio-list/RadioList.gen.css.ts",
//       "components/radio-list/RadioList.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Switch built-in component", () => {
//   function switchConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { full: tokens.dimension("9999px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//       },
//       transitions: {
//         standard: tokens.transition({ duration: "150ms", timingFunction: [0.24, 1, 0.4, 1] }),
//       },
//       elevation: {
//         sm: tokens.shadow({
//           color: ref.color.black,
//           offsetX: "0px",
//           offsetY: "1px",
//           blur: "2px",
//           spread: "0px",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Switch: {
//           trackWidth: system.spacing.md,
//           trackHeight: system.spacing.sm,
//           thumbSize: system.spacing.sm,
//           borderRadius: system.radius.full,
//           trackBackgroundColor: ref.color.white,
//           trackCheckedBackgroundColor: ref.color.black,
//           trackBorder: system.border.default,
//           thumbBackgroundColor: ref.color.white,
//           thumbShadow: system.elevation.sm,
//           disabledTrackBackgroundColor: ref.color.white,
//           labelTypography: system.textStyles.body,
//           labelColor: ref.color.black,
//           gap: system.spacing.sm,
//           transition: system.transitions.standard,
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Switch emits Switch.gen.css.ts and Switch.gen.tsx", () => {
//     const files = generate(switchConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/switch/Switch.gen.css.ts");
//     expect(filenames).toContain("components/switch/Switch.gen.tsx");
//   });
//
//   test("Switch.gen.tsx wraps Base UI's Switch and slides the thumb via data-checked", () => {
//     const files = generate(switchConfig());
//     const component = files.find((f) => f.filename === "components/switch/Switch.gen.tsx")!;
//     expect(component.content).toMatch(
//       /import { Switch as BaseSwitch } from "@base-ui\/react\/switch";/,
//     );
//     const styles = files.find((f) => f.filename === "components/switch/Switch.gen.css.ts")!;
//     expect(styles.content).toMatch(/\[data-checked\] > &/);
//   });
//
//   test("missing Switch bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Switch: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "trackWidth"/);
//   });
//
//   test("Switch generated sources pass assertParses", () => {
//     const files = generate(switchConfig());
//     for (const suffix of [
//       "components/switch/Switch.gen.css.ts",
//       "components/switch/Switch.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Toggle built-in component", () => {
//   function toggleConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { element: tokens.dimension("8px"), inner: tokens.dimension("4px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Toggle: {
//           borderRadius: system.radius.element,
//           optionBorderRadius: system.radius.inner,
//           border: system.border.default,
//           backgroundColor: ref.color.white,
//           color: ref.color.black,
//           typography: system.textStyles.body,
//           hoverColor: ref.color.black,
//           activeColor: ref.color.white,
//           activeBackgroundColor: ref.color.black,
//           disabledColor: ref.color.black,
//           sizes: {
//             md: {
//               horizontalSpacing: system.spacing.md,
//               verticalSpacing: system.spacing.sm,
//               typography: system.textStyles.body,
//             },
//           },
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Toggle emits Toggle.gen.css.ts and Toggle.gen.tsx", () => {
//     const files = generate(toggleConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/toggle/Toggle.gen.css.ts");
//     expect(filenames).toContain("components/toggle/Toggle.gen.tsx");
//   });
//
//   test("Toggle.gen.tsx wraps Base UI's ToggleGroup/Toggle with a two-option tuple", () => {
//     const files = generate(toggleConfig());
//     const component = files.find((f) => f.filename === "components/toggle/Toggle.gen.tsx")!;
//     expect(component.content).toMatch(
//       /import { ToggleGroup as BaseToggleGroup } from "@base-ui\/react\/toggle-group";/,
//     );
//     expect(component.content).toMatch(
//       /options: readonly \[ToggleOption<Value>, ToggleOption<Value>\];/,
//     );
//     expect(component.content).toMatch(/multiple={false}/);
//   });
//
//   test("missing Toggle bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Toggle: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "borderRadius"/);
//   });
//
//   test("Toggle generated sources pass assertParses", () => {
//     const files = generate(toggleConfig());
//     for (const suffix of [
//       "components/toggle/Toggle.gen.css.ts",
//       "components/toggle/Toggle.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Select built-in component", () => {
//   function selectConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { element: tokens.dimension("8px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//       },
//       elevation: {
//         md: tokens.shadow({
//           color: ref.color.black,
//           offsetX: "0px",
//           offsetY: "2px",
//           blur: "4px",
//           spread: "0px",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Select: {
//           borderRadius: system.radius.element,
//           border: system.border.default,
//           backgroundColor: ref.color.white,
//           color: ref.color.black,
//           typography: system.textStyles.body,
//           placeholderColor: ref.color.black,
//           horizontalSpacing: system.spacing.md,
//           verticalSpacing: system.spacing.sm,
//           hoverBorderColor: ref.color.black,
//           focusBorderColor: ref.color.black,
//           invalidBorderColor: ref.color.black,
//           disabledBackgroundColor: ref.color.white,
//           disabledColor: ref.color.black,
//           iconSize: system.spacing.md,
//           popupBackgroundColor: ref.color.white,
//           popupBorder: system.border.default,
//           popupBorderRadius: system.radius.element,
//           popupShadow: system.elevation.md,
//           popupSpacing: system.spacing.sm,
//           popupOffset: system.spacing.sm,
//           itemColor: ref.color.black,
//           itemTypography: system.textStyles.body,
//           itemHoverBackgroundColor: ref.color.white,
//           itemSelectedBackgroundColor: ref.color.white,
//           itemSelectedColor: ref.color.black,
//           itemDisabledColor: ref.color.black,
//           itemHorizontalSpacing: system.spacing.md,
//           itemVerticalSpacing: system.spacing.sm,
//           indicatorIcon: "chevronDown",
//           selectedIcon: "check",
//           clearIcon: "close",
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Select emits Select.gen.css.ts and Select.gen.tsx", () => {
//     const files = generate(selectConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/select/Select.gen.css.ts");
//     expect(filenames).toContain("components/select/Select.gen.tsx");
//   });
//
//   test("Select.gen.tsx wraps Base UI's Select and maps options to Select.Item", () => {
//     const files = generate(selectConfig());
//     const component = files.find((f) => f.filename === "components/select/Select.gen.tsx")!;
//     expect(component.content).toMatch(
//       /import { Select as BaseSelect } from "@base-ui\/react\/select";/,
//     );
//     expect(component.content).toMatch(/options\.map\(\(option\) =>/);
//     expect(component.content).toMatch(/const IndicatorIcon = icons\["chevronDown"\];/);
//     expect(component.content).toMatch(/const SelectedIcon = icons\["check"\];/);
//     expect(component.content).toMatch(/extends CommonComponentProps, FieldableInputProps/);
//   });
//
//   test("missing Select bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Select: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "borderRadius"/);
//   });
//
//   test("Select generated sources pass assertParses", () => {
//     const files = generate(selectConfig());
//     for (const suffix of [
//       "components/select/Select.gen.css.ts",
//       "components/select/Select.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Autocomplete built-in component", () => {
//   function autocompleteConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { element: tokens.dimension("8px"), inner: tokens.dimension("4px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//         supporting: tokens.typography({
//           fontFamily: "Arial",
//           fontSize: "12px",
//           fontWeight: "regular",
//         }),
//       },
//       elevation: {
//         md: tokens.shadow({
//           color: ref.color.black,
//           offsetX: "0px",
//           offsetY: "2px",
//           blur: "4px",
//           spread: "0px",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Autocomplete: {
//           borderRadius: system.radius.element,
//           border: system.border.default,
//           backgroundColor: ref.color.white,
//           color: ref.color.black,
//           typography: system.textStyles.body,
//           placeholderColor: ref.color.black,
//           horizontalSpacing: system.spacing.md,
//           verticalSpacing: system.spacing.sm,
//           hoverBorderColor: ref.color.black,
//           focusBorderColor: ref.color.black,
//           invalidBorderColor: ref.color.black,
//           disabledBackgroundColor: ref.color.white,
//           disabledColor: ref.color.black,
//           iconSize: system.spacing.md,
//           popupBackgroundColor: ref.color.white,
//           popupBorder: system.border.default,
//           popupBorderRadius: system.radius.element,
//           popupShadow: system.elevation.md,
//           popupSpacing: system.spacing.sm,
//           popupOffset: system.spacing.sm,
//           itemColor: ref.color.black,
//           itemTypography: system.textStyles.body,
//           itemHoverBackgroundColor: ref.color.white,
//           itemDisabledColor: ref.color.black,
//           itemHorizontalSpacing: system.spacing.md,
//           itemVerticalSpacing: system.spacing.sm,
//           gap: system.spacing.sm,
//           emptyStateColor: ref.color.black,
//           emptyStateTypography: system.textStyles.supporting,
//           emptyStateSpacing: system.spacing.md,
//           highlightColor: ref.color.white,
//           clearIcon: "close",
//           searchIcon: "search",
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Autocomplete emits Autocomplete.gen.css.ts and Autocomplete.gen.tsx", () => {
//     const files = generate(autocompleteConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/autocomplete/Autocomplete.gen.css.ts");
//     expect(filenames).toContain("components/autocomplete/Autocomplete.gen.tsx");
//   });
//
//   test("Autocomplete.gen.tsx wraps Base UI's Autocomplete with search icon and highlight", () => {
//     const files = generate(autocompleteConfig());
//     const component = files.find(
//       (f) => f.filename === "components/autocomplete/Autocomplete.gen.tsx",
//     )!;
//     expect(component.content).toMatch(
//       /import { Autocomplete as BaseAutocomplete } from "@base-ui\/react\/autocomplete";/,
//     );
//     expect(component.content).toMatch(/const SearchIcon = icons\["search"\];/);
//     expect(component.content).toMatch(/function highlightMatch\(/);
//     expect(component.content).toMatch(/extends CommonComponentProps, FieldableInputProps/);
//   });
//
//   test("missing Autocomplete bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Autocomplete: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "borderRadius"/);
//   });
//
//   test("Autocomplete generated sources pass assertParses", () => {
//     const files = generate(autocompleteConfig());
//     for (const suffix of [
//       "components/autocomplete/Autocomplete.gen.css.ts",
//       "components/autocomplete/Autocomplete.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("FileInput built-in component", () => {
//   function fileInputConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { element: tokens.dimension("8px"), inner: tokens.dimension("4px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//         supporting: tokens.typography({
//           fontFamily: "Arial",
//           fontSize: "12px",
//           fontWeight: "regular",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         FileInput: {
//           border: system.border.default,
//           borderRadius: system.radius.element,
//           backgroundColor: ref.color.white,
//           color: ref.color.black,
//           typography: system.textStyles.body,
//           hoverBorderColor: ref.color.black,
//           draggingBorderColor: ref.color.black,
//           draggingBackgroundColor: ref.color.white,
//           invalidBorderColor: ref.color.black,
//           disabledBackgroundColor: ref.color.white,
//           disabledColor: ref.color.black,
//           horizontalSpacing: system.spacing.md,
//           verticalSpacing: system.spacing.sm,
//           gap: system.spacing.sm,
//           iconSize: system.spacing.md,
//           fileTypography: system.textStyles.supporting,
//           fileColor: ref.color.black,
//           fileBorderRadius: system.radius.inner,
//           uploadIcon: "info",
//           removeIcon: "close",
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting FileInput emits FileInput.gen.css.ts and FileInput.gen.tsx", () => {
//     const files = generate(fileInputConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/file-input/FileInput.gen.css.ts");
//     expect(filenames).toContain("components/file-input/FileInput.gen.tsx");
//   });
//
//   test("FileInput.gen.tsx manages controlled/uncontrolled files with drag/drop and accept/size validation", () => {
//     const files = generate(fileInputConfig());
//     const component = files.find((f) => f.filename === "components/file-input/FileInput.gen.tsx")!;
//     expect(component.content).toMatch(/function matchesAccept\(/);
//     expect(component.content).toMatch(/onRejected\?\.\("type", rejectedByType\)/);
//     expect(component.content).toMatch(/onRejected\?\.\("size", rejectedBySize\)/);
//     expect(component.content).toMatch(/onDrop={handleDrop}/);
//   });
//
//   test("missing FileInput bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { FileInput: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "border"/);
//   });
//
//   test("FileInput generated sources pass assertParses", () => {
//     const files = generate(fileInputConfig());
//     for (const suffix of [
//       "components/file-input/FileInput.gen.css.ts",
//       "components/file-input/FileInput.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Slider built-in component", () => {
//   function sliderConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { full: tokens.dimension("9999px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       textStyles: {
//         supporting: tokens.typography({
//           fontFamily: "Arial",
//           fontSize: "12px",
//           fontWeight: "regular",
//         }),
//       },
//       elevation: {
//         sm: tokens.shadow({
//           color: ref.color.black,
//           offsetX: "0px",
//           offsetY: "1px",
//           blur: "2px",
//           spread: "0px",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Slider: {
//           trackBackgroundColor: ref.color.white,
//           trackHeight: system.spacing.sm,
//           borderRadius: system.radius.full,
//           indicatorBackgroundColor: ref.color.black,
//           thumbSize: system.spacing.md,
//           thumbBackgroundColor: ref.color.white,
//           thumbBorder: system.border.default,
//           thumbShadow: system.elevation.sm,
//           hoverThumbBackgroundColor: ref.color.white,
//           disabledTrackBackgroundColor: ref.color.white,
//           disabledThumbBackgroundColor: ref.color.white,
//           markColor: ref.color.black,
//           markTypography: system.textStyles.supporting,
//           valueLabelTypography: system.textStyles.supporting,
//           valueLabelColor: ref.color.white,
//           valueLabelBackgroundColor: ref.color.black,
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Slider emits Slider.gen.css.ts and Slider.gen.tsx", () => {
//     const files = generate(sliderConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/slider/Slider.gen.css.ts");
//     expect(filenames).toContain("components/slider/Slider.gen.tsx");
//   });
//
//   test("Slider.gen.tsx wraps Base UI's Slider, rendering one Thumb per value and positioning marks", () => {
//     const files = generate(sliderConfig());
//     const component = files.find((f) => f.filename === "components/slider/Slider.gen.tsx")!;
//     expect(component.content).toMatch(
//       /import { Slider as BaseSlider } from "@base-ui\/react\/slider";/,
//     );
//     expect(component.content).toMatch(/Array\.from\(\{ length: thumbCount \}/);
//     expect(component.content).toMatch(/marks\.map\(\(mark\) =>/);
//   });
//
//   test("missing Slider bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Slider: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "trackBackgroundColor"/);
//   });
//
//   test("Slider generated sources pass assertParses", () => {
//     const files = generate(sliderConfig());
//     for (const suffix of [
//       "components/slider/Slider.gen.css.ts",
//       "components/slider/Slider.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("TextInput built-in component", () => {
//   function textInputConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { element: tokens.dimension("8px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         TextInput: {
//           borderRadius: system.radius.element,
//           border: system.border.default,
//           backgroundColor: ref.color.white,
//           color: ref.color.black,
//           typography: system.textStyles.body,
//           placeholderColor: ref.color.black,
//           horizontalSpacing: system.spacing.md,
//           verticalSpacing: system.spacing.sm,
//           gap: system.spacing.sm,
//           hoverBorderColor: ref.color.black,
//           focusBorderColor: ref.color.black,
//           invalidBorderColor: ref.color.black,
//           disabledBackgroundColor: ref.color.white,
//           disabledColor: ref.color.black,
//           readOnlyBackgroundColor: ref.color.white,
//           iconColor: ref.color.black,
//           iconSize: system.spacing.md,
//           affixColor: ref.color.black,
//           affixBackgroundColor: ref.color.white,
//           clearIcon: "close",
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting TextInput emits TextInput.gen.css.ts and TextInput.gen.tsx", () => {
//     const files = generate(textInputConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/text-input/TextInput.gen.css.ts");
//     expect(filenames).toContain("components/text-input/TextInput.gen.tsx");
//   });
//
//   test("TextInput.gen.tsx renders affixes/icons around a renderElement-driven input", () => {
//     const files = generate(textInputConfig());
//     const component = files.find((f) => f.filename === "components/text-input/TextInput.gen.tsx")!;
//     expect(component.content).toMatch(/renderElement\("input", render, fieldProps/);
//     expect(component.content).toMatch(/extends CommonComponentProps, FieldableInputProps/);
//     expect(component.content).toMatch(/const ClearIcon = icons\["close"\];/);
//   });
//
//   test("missing TextInput bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { TextInput: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "borderRadius"/);
//   });
//
//   test("TextInput generated sources pass assertParses", () => {
//     const files = generate(textInputConfig());
//     for (const suffix of [
//       "components/text-input/TextInput.gen.css.ts",
//       "components/text-input/TextInput.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("NumberInput built-in component", () => {
//   function numberInputConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { element: tokens.dimension("8px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: {
//         sm: tokens.dimension("4px"),
//         md: tokens.dimension("8px"),
//         lg: tokens.dimension("24px"),
//       },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         NumberInput: {
//           borderRadius: system.radius.element,
//           border: system.border.default,
//           backgroundColor: ref.color.white,
//           color: ref.color.black,
//           typography: system.textStyles.body,
//           placeholderColor: ref.color.black,
//           horizontalSpacing: system.spacing.md,
//           verticalSpacing: system.spacing.sm,
//           gap: system.spacing.sm,
//           hoverBorderColor: ref.color.black,
//           focusBorderColor: ref.color.black,
//           invalidBorderColor: ref.color.black,
//           disabledBackgroundColor: ref.color.white,
//           disabledColor: ref.color.black,
//           readOnlyBackgroundColor: ref.color.white,
//           iconColor: ref.color.black,
//           iconSize: system.spacing.sm,
//           affixColor: ref.color.black,
//           affixBackgroundColor: ref.color.white,
//           stepperBackgroundColor: ref.color.white,
//           stepperColor: ref.color.black,
//           stepperHoverBackgroundColor: ref.color.white,
//           stepperBorder: system.border.default,
//           stepperWidth: system.spacing.lg,
//           incrementIcon: "chevronDown",
//           decrementIcon: "chevronDown",
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting NumberInput emits NumberInput.gen.css.ts and NumberInput.gen.tsx", () => {
//     const files = generate(numberInputConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/number-input/NumberInput.gen.css.ts");
//     expect(filenames).toContain("components/number-input/NumberInput.gen.tsx");
//   });
//
//   test("NumberInput.gen.tsx wraps Base UI's NumberField with a stepper", () => {
//     const files = generate(numberInputConfig());
//     const component = files.find(
//       (f) => f.filename === "components/number-input/NumberInput.gen.tsx",
//     )!;
//     expect(component.content).toMatch(
//       /import { NumberField as BaseNumberField } from "@base-ui\/react\/number-field";/,
//     );
//     expect(component.content).toMatch(/<BaseNumberField.Increment/);
//     expect(component.content).toMatch(/<BaseNumberField.Decrement/);
//   });
//
//   test("missing NumberInput bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { NumberInput: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "borderRadius"/);
//   });
//
//   test("NumberInput generated sources pass assertParses", () => {
//     const files = generate(numberInputConfig());
//     for (const suffix of [
//       "components/number-input/NumberInput.gen.css.ts",
//       "components/number-input/NumberInput.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("DateInput built-in component", () => {
//   function dateInputConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { element: tokens.dimension("8px"), inner: tokens.dimension("4px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//         supporting: tokens.typography({
//           fontFamily: "Arial",
//           fontSize: "12px",
//           fontWeight: "regular",
//         }),
//       },
//       elevation: {
//         md: tokens.shadow({
//           color: ref.color.black,
//           offsetX: "0px",
//           offsetY: "2px",
//           blur: "4px",
//           spread: "0px",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         DateInput: {
//           borderRadius: system.radius.element,
//           border: system.border.default,
//           backgroundColor: ref.color.white,
//           color: ref.color.black,
//           typography: system.textStyles.body,
//           placeholderColor: ref.color.black,
//           horizontalSpacing: system.spacing.md,
//           verticalSpacing: system.spacing.sm,
//           gap: system.spacing.sm,
//           hoverBorderColor: ref.color.black,
//           focusBorderColor: ref.color.black,
//           invalidBorderColor: ref.color.black,
//           disabledBackgroundColor: ref.color.white,
//           disabledColor: ref.color.black,
//           readOnlyBackgroundColor: ref.color.white,
//           iconColor: ref.color.black,
//           iconSize: system.spacing.md,
//           affixColor: ref.color.black,
//           affixBackgroundColor: ref.color.white,
//           popupBackgroundColor: ref.color.white,
//           popupBorder: system.border.default,
//           popupBorderRadius: system.radius.element,
//           popupShadow: system.elevation.md,
//           popupSpacing: system.spacing.md,
//           popupOffset: system.spacing.sm,
//           dayTypography: system.textStyles.body,
//           dayColor: ref.color.black,
//           dayBorderRadius: system.radius.inner,
//           dayHoverBackgroundColor: ref.color.white,
//           daySelectedBackgroundColor: ref.color.black,
//           daySelectedColor: ref.color.white,
//           dayTodayBorderColor: ref.color.black,
//           dayOutsideMonthColor: ref.color.black,
//           dayDisabledColor: ref.color.black,
//           weekdayTypography: system.textStyles.supporting,
//           weekdayColor: ref.color.black,
//           calendarIcon: "info",
//           previousIcon: "chevronDown",
//           nextIcon: "chevronDown",
//           clearIcon: "close",
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting DateInput emits DateInput.gen.css.ts and DateInput.gen.tsx", () => {
//     const files = generate(dateInputConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/date-input/DateInput.gen.css.ts");
//     expect(filenames).toContain("components/date-input/DateInput.gen.tsx");
//   });
//
//   test("DateInput.gen.tsx wraps Base UI's Popover around a react-day-picker calendar", () => {
//     const files = generate(dateInputConfig());
//     const component = files.find((f) => f.filename === "components/date-input/DateInput.gen.tsx")!;
//     expect(component.content).toMatch(
//       /import { Popover as BasePopover } from "@base-ui\/react\/popover";/,
//     );
//     expect(component.content).toMatch(/import { DayPicker } from "react-day-picker";/);
//     expect(component.content).toMatch(/import { format } from "date-fns";/);
//     expect(component.content).toMatch(/<DayPicker/);
//     expect(component.content).toMatch(/mode="single"/);
//   });
//
//   test("DateInput declares react-day-picker and date-fns as runtime dependencies", () => {
//     const files = generate(dateInputConfig());
//     const dependencies = files.find((f) => f.filename === "components.dependencies.json")!;
//     const parsed = JSON.parse(dependencies.content) as Record<string, string>;
//     expect(parsed["react-day-picker"]).toBeDefined();
//     expect(parsed["date-fns"]).toBeDefined();
//   });
//
//   test("missing DateInput bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { DateInput: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "borderRadius"/);
//   });
//
//   test("DateInput generated sources pass assertParses", () => {
//     const files = generate(dateInputConfig());
//     for (const suffix of [
//       "components/date-input/DateInput.gen.css.ts",
//       "components/date-input/DateInput.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Textarea built-in component", () => {
//   function textareaConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { element: tokens.dimension("8px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//         supporting: tokens.typography({
//           fontFamily: "Arial",
//           fontSize: "12px",
//           fontWeight: "regular",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Textarea: {
//           borderRadius: system.radius.element,
//           border: system.border.default,
//           backgroundColor: ref.color.white,
//           color: ref.color.black,
//           typography: system.textStyles.body,
//           placeholderColor: ref.color.black,
//           horizontalSpacing: system.spacing.md,
//           verticalSpacing: system.spacing.sm,
//           gap: system.spacing.sm,
//           hoverBorderColor: ref.color.black,
//           focusBorderColor: ref.color.black,
//           invalidBorderColor: ref.color.black,
//           disabledBackgroundColor: ref.color.white,
//           disabledColor: ref.color.black,
//           readOnlyBackgroundColor: ref.color.white,
//           iconColor: ref.color.black,
//           iconSize: system.spacing.md,
//           affixColor: ref.color.black,
//           affixBackgroundColor: ref.color.white,
//           counterTypography: system.textStyles.supporting,
//           counterColor: ref.color.black,
//           counterExceededColor: ref.color.black,
//           counterGap: system.spacing.sm,
//           resizeHandleColor: ref.color.black,
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Textarea emits Textarea.gen.css.ts and Textarea.gen.tsx", () => {
//     const files = generate(textareaConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/textarea/Textarea.gen.css.ts");
//     expect(filenames).toContain("components/textarea/Textarea.gen.tsx");
//   });
//
//   test("Textarea.gen.tsx tracks value locally for the character counter and supports autoResize", () => {
//     const files = generate(textareaConfig());
//     const component = files.find((f) => f.filename === "components/textarea/Textarea.gen.tsx")!;
//     expect(component.content).toMatch(/const \[uncontrolledValue, setUncontrolledValue\]/);
//     expect(component.content).toMatch(/renderElement\("textarea", render, fieldProps/);
//     expect(component.content).toMatch(/fieldSizing: "content"/);
//   });
//
//   test("missing Textarea bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Textarea: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "borderRadius"/);
//   });
//
//   test("Textarea generated sources pass assertParses", () => {
//     const files = generate(textareaConfig());
//     for (const suffix of [
//       "components/textarea/Textarea.gen.css.ts",
//       "components/textarea/Textarea.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Field built-in component", () => {
//   function fieldConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       spacing: { sm: tokens.dimension("4px") },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//         supporting: tokens.typography({
//           fontFamily: "Arial",
//           fontSize: "12px",
//           fontWeight: "regular",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Field: {
//           labelTypography: system.textStyles.body,
//           labelColor: ref.color.black,
//           descriptionTypography: system.textStyles.supporting,
//           descriptionColor: ref.color.black,
//           errorTypography: system.textStyles.supporting,
//           errorColor: ref.color.black,
//           requiredIndicatorColor: ref.color.black,
//           optionalTypography: system.textStyles.supporting,
//           optionalColor: ref.color.black,
//           gap: system.spacing.sm,
//           iconSize: system.spacing.sm,
//           errorIcon: "alert",
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Field emits Field.gen.css.ts and Field.gen.tsx", () => {
//     const files = generate(fieldConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/field/Field.gen.css.ts");
//     expect(filenames).toContain("components/field/Field.gen.tsx");
//   });
//
//   test("Field.gen.tsx wraps Base UI's Field with label/description/error rows", () => {
//     const files = generate(fieldConfig());
//     const component = files.find((f) => f.filename === "components/field/Field.gen.tsx")!;
//     expect(component.content).toMatch(
//       /import { Field as BaseField } from "@base-ui\/react\/field";/,
//     );
//     expect(component.content).toMatch(/<BaseField.Label/);
//     expect(component.content).toMatch(/<BaseField.Description/);
//     expect(component.content).toMatch(/<BaseField.Error/);
//   });
//
//   test("missing Field bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Field: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "labelTypography"/);
//   });
//
//   test("Field generated sources pass assertParses", () => {
//     const files = generate(fieldConfig());
//     for (const suffix of ["components/field/Field.gen.css.ts", "components/field/Field.gen.tsx"]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Breadcrumb built-in component", () => {
//   function breadcrumbConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       spacing: { sm: tokens.dimension("4px") },
//       textStyles: {
//         supporting: tokens.typography({
//           fontFamily: "Arial",
//           fontSize: "12px",
//           fontWeight: "regular",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Breadcrumb: {
//           typography: system.textStyles.supporting,
//           color: ref.color.black,
//           hoverColor: ref.color.black,
//           currentColor: ref.color.black,
//           currentTypography: system.textStyles.supporting,
//           separatorColor: ref.color.black,
//           gap: system.spacing.sm,
//           iconSize: system.spacing.sm,
//           separatorIcon: "chevronDown",
//           overflowIcon: "info",
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Breadcrumb emits Breadcrumb.gen.css.ts and Breadcrumb.gen.tsx", () => {
//     const files = generate(breadcrumbConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/breadcrumb/Breadcrumb.gen.css.ts");
//     expect(filenames).toContain("components/breadcrumb/Breadcrumb.gen.tsx");
//   });
//
//   test("Breadcrumb.gen.tsx renders an ordered list with a collapsible overflow trigger", () => {
//     const files = generate(breadcrumbConfig());
//     const component = files.find((f) => f.filename === "components/breadcrumb/Breadcrumb.gen.tsx")!;
//     expect(component.content).toMatch(/renderElement\("nav", render, rootProps/);
//     expect(component.content).toMatch(/visibleItems\.map\(\(item, index\) =>/);
//     expect(component.content).toMatch(/aria-current="page"/);
//   });
//
//   test("missing Breadcrumb bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Breadcrumb: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "typography"/);
//   });
//
//   test("Breadcrumb generated sources pass assertParses", () => {
//     const files = generate(breadcrumbConfig());
//     for (const suffix of [
//       "components/breadcrumb/Breadcrumb.gen.css.ts",
//       "components/breadcrumb/Breadcrumb.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Outline built-in component", () => {
//   function outlineConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       textStyles: {
//         supporting: tokens.typography({
//           fontFamily: "Arial",
//           fontSize: "12px",
//           fontWeight: "regular",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Outline: {
//           typography: system.textStyles.supporting,
//           color: ref.color.black,
//           hoverColor: ref.color.black,
//           activeColor: ref.color.black,
//           activeTypography: system.textStyles.supporting,
//           border: system.border.default,
//           activeIndicatorColor: ref.color.black,
//           indentSpacing: system.spacing.md,
//           itemHorizontalSpacing: system.spacing.md,
//           itemVerticalSpacing: system.spacing.sm,
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Outline emits Outline.gen.css.ts and Outline.gen.tsx", () => {
//     const files = generate(outlineConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/outline/Outline.gen.css.ts");
//     expect(filenames).toContain("components/outline/Outline.gen.tsx");
//   });
//
//   test("Outline.gen.tsx recursively renders nested items and observes scroll with IntersectionObserver", () => {
//     const files = generate(outlineConfig());
//     const component = files.find((f) => f.filename === "components/outline/Outline.gen.tsx")!;
//     expect(component.content).toMatch(/function OutlineList\(/);
//     expect(component.content).toMatch(/new IntersectionObserver\(/);
//     expect(component.content).toMatch(/renderElement\("nav", render, rootProps/);
//   });
//
//   test("missing Outline bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Outline: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "typography"/);
//   });
//
//   test("Outline generated sources pass assertParses", () => {
//     const files = generate(outlineConfig());
//     for (const suffix of [
//       "components/outline/Outline.gen.css.ts",
//       "components/outline/Outline.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Pagination built-in component", () => {
//   function paginationConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { inner: tokens.dimension("4px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: {
//         sm: tokens.dimension("4px"),
//         md: tokens.dimension("8px"),
//         lg: tokens.dimension("32px"),
//       },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//         supporting: tokens.typography({
//           fontFamily: "Arial",
//           fontSize: "12px",
//           fontWeight: "regular",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Pagination: {
//           borderRadius: system.radius.inner,
//           border: system.border.default,
//           typography: system.textStyles.supporting,
//           color: ref.color.black,
//           backgroundColor: ref.color.white,
//           hoverColor: ref.color.black,
//           hoverBackgroundColor: ref.color.white,
//           activeColor: ref.color.white,
//           activeBackgroundColor: ref.color.black,
//           disabledColor: ref.color.black,
//           ellipsisColor: ref.color.black,
//           gap: system.spacing.sm,
//           iconSize: system.spacing.sm,
//           sizes: {
//             md: {
//               minSize: system.spacing.lg,
//               horizontalSpacing: system.spacing.md,
//               verticalSpacing: system.spacing.sm,
//               typography: system.textStyles.body,
//             },
//           },
//           previousIcon: "chevronDown",
//           nextIcon: "chevronDown",
//           firstIcon: "chevronDown",
//           lastIcon: "chevronDown",
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Pagination emits Pagination.gen.css.ts and Pagination.gen.tsx", () => {
//     const files = generate(paginationConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/pagination/Pagination.gen.css.ts");
//     expect(filenames).toContain("components/pagination/Pagination.gen.tsx");
//   });
//
//   test("Pagination.gen.tsx computes a sibling/boundary range with ellipses", () => {
//     const files = generate(paginationConfig());
//     const component = files.find((f) => f.filename === "components/pagination/Pagination.gen.tsx")!;
//     expect(component.content).toMatch(/function getPaginationRange\(/);
//     expect(component.content).toMatch(/"start-ellipsis"/);
//     expect(component.content).toMatch(/"end-ellipsis"/);
//     expect(component.content).toMatch(/renderElement\("nav", render, rootProps/);
//   });
//
//   test("missing Pagination bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Pagination: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "borderRadius"/);
//   });
//
//   test("Pagination generated sources pass assertParses", () => {
//     const files = generate(paginationConfig());
//     for (const suffix of [
//       "components/pagination/Pagination.gen.css.ts",
//       "components/pagination/Pagination.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Tabs built-in component", () => {
//   function tabsConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { none: tokens.dimension("0px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Tabs: {
//           typography: system.textStyles.body,
//           activeTypography: system.textStyles.body,
//           disabledColor: ref.color.black,
//           indicatorThickness: system.spacing.sm,
//           horizontalSpacing: system.spacing.md,
//           verticalSpacing: system.spacing.sm,
//           gap: system.spacing.sm,
//           tabGap: system.spacing.sm,
//           panelSpacing: system.spacing.md,
//           iconSize: system.spacing.md,
//           variants: {
//             line: {
//               color: ref.color.black,
//               activeColor: ref.color.black,
//               hoverColor: ref.color.black,
//               backgroundColor: ref.color.white,
//               activeBackgroundColor: ref.color.white,
//               indicatorColor: ref.color.black,
//               border: system.border.default,
//               borderRadius: system.radius.none,
//             },
//           },
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Tabs emits Tabs.gen.css.ts and Tabs.gen.tsx", () => {
//     const files = generate(tabsConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/tabs/Tabs.gen.css.ts");
//     expect(filenames).toContain("components/tabs/Tabs.gen.tsx");
//   });
//
//   test("Tabs.gen.tsx wraps Base UI's Tabs and positions the indicator via CSS vars", () => {
//     const files = generate(tabsConfig());
//     const component = files.find((f) => f.filename === "components/tabs/Tabs.gen.tsx")!;
//     expect(component.content).toMatch(/import { Tabs as BaseTabs } from "@base-ui\/react\/tabs";/);
//     expect(component.content).toMatch(/export type TabsVariant = "line";/);
//     expect(component.content).toMatch(/<BaseTabs.Indicator/);
//
//     const styles = files.find((f) => f.filename === "components/tabs/Tabs.gen.css.ts")!;
//     expect(styles.content).toMatch(/var\(--active-tab-width\)/);
//   });
//
//   test("missing Tabs bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Tabs: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "typography"/);
//   });
//
//   test("Tabs generated sources pass assertParses", () => {
//     const files = generate(tabsConfig());
//     for (const suffix of ["components/tabs/Tabs.gen.css.ts", "components/tabs/Tabs.gen.tsx"]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Steps built-in component", () => {
//   function stepsConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { full: tokens.dimension("9999px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//         supporting: tokens.typography({
//           fontFamily: "Arial",
//           fontSize: "12px",
//           fontWeight: "regular",
//         }),
//       },
//     });
//     const statusFields = {
//       indicatorBackgroundColor: ref.color.black,
//       indicatorColor: ref.color.white,
//       indicatorBorder: system.border.default,
//       labelColor: ref.color.black,
//       connectorColor: ref.color.black,
//     };
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Steps: {
//           labelTypography: system.textStyles.body,
//           descriptionTypography: system.textStyles.supporting,
//           descriptionColor: ref.color.black,
//           connectorThickness: system.spacing.sm,
//           connectorSpacing: system.spacing.sm,
//           indicatorBorderRadius: system.radius.full,
//           statuses: {
//             complete: statusFields,
//             current: statusFields,
//             upcoming: statusFields,
//             error: statusFields,
//           },
//           sizes: {
//             md: {
//               indicatorSize: system.spacing.md,
//               typography: system.textStyles.body,
//               gap: system.spacing.sm,
//             },
//           },
//           completeIcon: "check",
//           errorIcon: "alert",
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Steps emits Steps.gen.css.ts and Steps.gen.tsx", () => {
//     const files = generate(stepsConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/steps/Steps.gen.css.ts");
//     expect(filenames).toContain("components/steps/Steps.gen.tsx");
//   });
//
//   test("Steps.gen.tsx derives status from activeStep with a fixed complete/current/upcoming/error union", () => {
//     const files = generate(stepsConfig());
//     const component = files.find((f) => f.filename === "components/steps/Steps.gen.tsx")!;
//     expect(component.content).toMatch(
//       /export type StepStatus = "complete" \| "current" \| "upcoming" \| "error";/,
//     );
//     expect(component.content).toMatch(/function deriveStatus\(/);
//     expect(component.content).toMatch(/renderElement\("ol", render, rootProps/);
//   });
//
//   test("missing Steps bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Steps: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "statuses"/);
//   });
//
//   test("Steps generated sources pass assertParses", () => {
//     const files = generate(stepsConfig());
//     for (const suffix of ["components/steps/Steps.gen.css.ts", "components/steps/Steps.gen.tsx"]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Dialog built-in component", () => {
//   function dialogConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//       overlayWidth: {
//         sm: tokens.dimension("24rem"),
//         md: tokens.dimension("32rem"),
//         lg: tokens.dimension("48rem"),
//         fullscreen: tokens.dimension("96rem"),
//       },
//     });
//     const system = defineSystemTokens({
//       radius: { container: tokens.dimension("12px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//         title: tokens.typography({ fontFamily: "Arial", fontSize: "20px", fontWeight: "bold" }),
//       },
//       transitions: {
//         standard: tokens.transition({ duration: "150ms", timingFunction: [0.24, 1, 0.4, 1] }),
//       },
//       elevation: {
//         md: tokens.shadow({
//           color: ref.color.black,
//           offsetX: "0px",
//           offsetY: "2px",
//           blur: "4px",
//           spread: "0px",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Dialog: {
//           backdropColor: ref.color.black,
//           backgroundColor: ref.color.white,
//           border: system.border.default,
//           borderRadius: system.radius.container,
//           shadow: system.elevation.md,
//           horizontalSpacing: system.spacing.md,
//           verticalSpacing: system.spacing.sm,
//           gap: system.spacing.sm,
//           titleTypography: system.textStyles.title,
//           titleColor: ref.color.black,
//           descriptionTypography: system.textStyles.body,
//           descriptionColor: ref.color.black,
//           footerBorder: system.border.default,
//           transition: system.transitions.standard,
//           sizes: {
//             sm: { maxWidth: ref.overlayWidth.sm },
//             md: { maxWidth: ref.overlayWidth.md },
//             lg: { maxWidth: ref.overlayWidth.lg },
//             fullscreen: { maxWidth: ref.overlayWidth.fullscreen },
//           },
//           closeIcon: "close",
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Dialog emits Dialog.gen.css.ts and Dialog.gen.tsx", () => {
//     const files = generate(dialogConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/dialog/Dialog.gen.css.ts");
//     expect(filenames).toContain("components/dialog/Dialog.gen.tsx");
//   });
//
//   test("Dialog.gen.tsx wraps Base UI's Dialog with a fixed sm/md/lg/fullscreen size union", () => {
//     const files = generate(dialogConfig());
//     const component = files.find((f) => f.filename === "components/dialog/Dialog.gen.tsx")!;
//     expect(component.content).toMatch(
//       /import { Dialog as BaseDialog } from "@base-ui\/react\/dialog";/,
//     );
//     expect(component.content).toMatch(
//       /export type DialogSize = "sm" \| "md" \| "lg" \| "fullscreen";/,
//     );
//     expect(component.content).toMatch(/disablePointerDismissal={!dismissible}/);
//
//     const styles = files.find((f) => f.filename === "components/dialog/Dialog.gen.css.ts")!;
//     expect(styles.content).toMatch(/"fullscreen":\s*\{/);
//   });
//
//   test("missing Dialog bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Dialog: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "backdropColor"/);
//   });
//
//   test("Dialog generated sources pass assertParses", () => {
//     const files = generate(dialogConfig());
//     for (const suffix of [
//       "components/dialog/Dialog.gen.css.ts",
//       "components/dialog/Dialog.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Drawer built-in component", () => {
//   function drawerConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//       overlayWidth: {
//         sm: tokens.dimension("16rem"),
//         md: tokens.dimension("24rem"),
//         lg: tokens.dimension("32rem"),
//         full: tokens.dimension("100rem"),
//       },
//     });
//     const system = defineSystemTokens({
//       radius: { container: tokens.dimension("12px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       textStyles: {
//         title: tokens.typography({ fontFamily: "Arial", fontSize: "20px", fontWeight: "bold" }),
//       },
//       transitions: {
//         medium: tokens.transition({ duration: "300ms", timingFunction: [0.24, 1, 0.4, 1] }),
//       },
//       elevation: {
//         md: tokens.shadow({
//           color: ref.color.black,
//           offsetX: "0px",
//           offsetY: "2px",
//           blur: "4px",
//           spread: "0px",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Drawer: {
//           backdropColor: ref.color.black,
//           backgroundColor: ref.color.white,
//           border: system.border.default,
//           borderRadius: system.radius.container,
//           shadow: system.elevation.md,
//           horizontalSpacing: system.spacing.md,
//           verticalSpacing: system.spacing.sm,
//           gap: system.spacing.sm,
//           titleTypography: system.textStyles.title,
//           titleColor: ref.color.black,
//           footerBorder: system.border.default,
//           transition: system.transitions.medium,
//           sizes: {
//             sm: { size: ref.overlayWidth.sm },
//             md: { size: ref.overlayWidth.md },
//             lg: { size: ref.overlayWidth.lg },
//             full: { size: ref.overlayWidth.full },
//           },
//           closeIcon: "close",
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Drawer emits Drawer.gen.css.ts and Drawer.gen.tsx", () => {
//     const files = generate(drawerConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/drawer/Drawer.gen.css.ts");
//     expect(filenames).toContain("components/drawer/Drawer.gen.tsx");
//   });
//
//   test("Drawer.gen.tsx wraps Base UI's Dialog with edge placement and a fixed sm/md/lg/full size union", () => {
//     const files = generate(drawerConfig());
//     const component = files.find((f) => f.filename === "components/drawer/Drawer.gen.tsx")!;
//     expect(component.content).toMatch(
//       /import { Dialog as BaseDialog } from "@base-ui\/react\/dialog";/,
//     );
//     expect(component.content).toMatch(/export type DrawerSize = "sm" \| "md" \| "lg" \| "full";/);
//     expect(component.content).toMatch(/placement === "left" \|\| placement === "right"/);
//
//     const styles = files.find((f) => f.filename === "components/drawer/Drawer.gen.css.ts")!;
//     expect(styles.content).toMatch(/export const drawerPlacement = styleVariants/);
//   });
//
//   test("missing Drawer bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Drawer: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "backdropColor"/);
//   });
//
//   test("Drawer generated sources pass assertParses", () => {
//     const files = generate(drawerConfig());
//     for (const suffix of [
//       "components/drawer/Drawer.gen.css.ts",
//       "components/drawer/Drawer.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Tooltip built-in component", () => {
//   function tooltipConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { inner: tokens.dimension("4px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       textStyles: {
//         supporting: tokens.typography({
//           fontFamily: "Arial",
//           fontSize: "12px",
//           fontWeight: "regular",
//         }),
//       },
//       transitions: {
//         standard: tokens.transition({ duration: "150ms", timingFunction: [0.24, 1, 0.4, 1] }),
//       },
//       elevation: {
//         sm: tokens.shadow({
//           color: ref.color.black,
//           offsetX: "0px",
//           offsetY: "1px",
//           blur: "2px",
//           spread: "0px",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Tooltip: {
//           backgroundColor: ref.color.black,
//           color: ref.color.white,
//           typography: system.textStyles.supporting,
//           borderRadius: system.radius.inner,
//           border: system.border.default,
//           shadow: system.elevation.sm,
//           horizontalSpacing: system.spacing.md,
//           verticalSpacing: system.spacing.sm,
//           offset: system.spacing.sm,
//           maxWidth: system.spacing.md,
//           arrowSize: system.spacing.sm,
//           transition: system.transitions.standard,
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Tooltip emits Tooltip.gen.css.ts and Tooltip.gen.tsx", () => {
//     const files = generate(tooltipConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/tooltip/Tooltip.gen.css.ts");
//     expect(filenames).toContain("components/tooltip/Tooltip.gen.tsx");
//   });
//
//   test("Tooltip.gen.tsx wraps Base UI's Tooltip, using children as the render-prop trigger and no render prop of its own", () => {
//     const files = generate(tooltipConfig());
//     const component = files.find((f) => f.filename === "components/tooltip/Tooltip.gen.tsx")!;
//     expect(component.content).toMatch(
//       /import { Tooltip as BaseTooltip } from "@base-ui\/react\/tooltip";/,
//     );
//     expect(component.content).toMatch(/<BaseTooltip.Trigger render={children}/);
//     expect(component.content).not.toMatch(/render\?:\s*RenderProp/);
//   });
//
//   test("missing Tooltip bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Tooltip: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "backgroundColor"/);
//   });
//
//   test("Tooltip generated sources pass assertParses", () => {
//     const files = generate(tooltipConfig());
//     for (const suffix of [
//       "components/tooltip/Tooltip.gen.css.ts",
//       "components/tooltip/Tooltip.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Popover built-in component", () => {
//   function popoverConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { element: tokens.dimension("8px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       transitions: {
//         standard: tokens.transition({ duration: "150ms", timingFunction: [0.24, 1, 0.4, 1] }),
//       },
//       elevation: {
//         md: tokens.shadow({
//           color: ref.color.black,
//           offsetX: "0px",
//           offsetY: "2px",
//           blur: "4px",
//           spread: "0px",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Popover: {
//           backgroundColor: ref.color.white,
//           color: ref.color.black,
//           border: system.border.default,
//           borderRadius: system.radius.element,
//           shadow: system.elevation.md,
//           horizontalSpacing: system.spacing.md,
//           verticalSpacing: system.spacing.sm,
//           offset: system.spacing.sm,
//           maxWidth: system.spacing.md,
//           backdropColor: ref.color.black,
//           arrowSize: system.spacing.sm,
//           transition: system.transitions.standard,
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Popover emits Popover.gen.css.ts and Popover.gen.tsx", () => {
//     const files = generate(popoverConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/popover/Popover.gen.css.ts");
//     expect(filenames).toContain("components/popover/Popover.gen.tsx");
//   });
//
//   test("Popover.gen.tsx wraps Base UI's Popover, rendering the backdrop only when modal", () => {
//     const files = generate(popoverConfig());
//     const component = files.find((f) => f.filename === "components/popover/Popover.gen.tsx")!;
//     expect(component.content).toMatch(
//       /import { Popover as BasePopover } from "@base-ui\/react\/popover";/,
//     );
//     expect(component.content).toMatch(/\{modal && <BasePopover.Backdrop/);
//     expect(component.content).toMatch(/<BasePopover.Trigger render={trigger} \/>/);
//   });
//
//   test("missing Popover bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Popover: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "backgroundColor"/);
//   });
//
//   test("Popover generated sources pass assertParses", () => {
//     const files = generate(popoverConfig());
//     for (const suffix of [
//       "components/popover/Popover.gen.css.ts",
//       "components/popover/Popover.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Toast built-in component", () => {
//   function toastConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { element: tokens.dimension("8px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//         supporting: tokens.typography({
//           fontFamily: "Arial",
//           fontSize: "12px",
//           fontWeight: "regular",
//         }),
//       },
//       transitions: {
//         standard: tokens.transition({ duration: "150ms", timingFunction: [0.24, 1, 0.4, 1] }),
//       },
//       elevation: {
//         md: tokens.shadow({
//           color: ref.color.black,
//           offsetX: "0px",
//           offsetY: "2px",
//           blur: "4px",
//           spread: "0px",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Toast: {
//           backgroundColor: ref.color.white,
//           border: system.border.default,
//           borderRadius: system.radius.element,
//           shadow: system.elevation.md,
//           titleTypography: system.textStyles.body,
//           descriptionTypography: system.textStyles.supporting,
//           descriptionColor: ref.color.black,
//           horizontalSpacing: system.spacing.md,
//           verticalSpacing: system.spacing.sm,
//           gap: system.spacing.sm,
//           stackGap: system.spacing.sm,
//           offset: system.spacing.md,
//           width: system.spacing.md,
//           iconSize: system.spacing.sm,
//           transition: system.transitions.standard,
//           closeIcon: "close",
//           statuses: {
//             info: {
//               color: ref.color.black,
//               backgroundColor: ref.color.white,
//               borderColor: ref.color.black,
//               iconColor: ref.color.black,
//               titleColor: ref.color.black,
//               icon: "info",
//             },
//             danger: {
//               color: ref.color.black,
//               backgroundColor: ref.color.white,
//               borderColor: ref.color.black,
//               iconColor: ref.color.black,
//               titleColor: ref.color.black,
//               icon: "alert",
//             },
//           },
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Toast emits Toast.gen.css.ts and Toast.gen.tsx", () => {
//     const files = generate(toastConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/toast/Toast.gen.css.ts");
//     expect(filenames).toContain("components/toast/Toast.gen.tsx");
//   });
//
//   test("Toast.gen.tsx exports both ToastProvider and a useToast hook wrapping Base UI's toast manager", () => {
//     const files = generate(toastConfig());
//     const component = files.find((f) => f.filename === "components/toast/Toast.gen.tsx")!;
//     expect(component.content).toMatch(
//       /import { Toast as BaseToast } from "@base-ui\/react\/toast";/,
//     );
//     expect(component.content).toMatch(/export function ToastProvider\(/);
//     expect(component.content).toMatch(/export function useToast\(\): UseToastReturn/);
//     expect(component.content).toMatch(/BaseToast\.useToastManager\(\)/);
//     expect(component.content).toMatch(/"info": "info" as IconType,/);
//     expect(component.content).toMatch(/"danger": "alert" as IconType,/);
//   });
//
//   test("missing Toast bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Toast: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "backgroundColor"/);
//   });
//
//   test("Toast generated sources pass assertParses", () => {
//     const files = generate(toastConfig());
//     for (const suffix of ["components/toast/Toast.gen.css.ts", "components/toast/Toast.gen.tsx"]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("MetadataList built-in component", () => {
//   function metadataListConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//       gapScale: tokens.dimensionScale({ sm: "4px", md: "8px" }),
//     });
//     const system = defineSystemTokens({
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px") },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//         supporting: tokens.typography({
//           fontFamily: "Arial",
//           fontSize: "12px",
//           fontWeight: "regular",
//         }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         MetadataList: {
//           gaps: ref.gapScale,
//           labelTypography: system.textStyles.supporting,
//           labelColor: ref.color.black,
//           valueTypography: system.textStyles.body,
//           valueColor: ref.color.black,
//           pairGap: system.spacing.sm,
//           iconSize: system.spacing.sm,
//           iconColor: ref.color.black,
//           divider: system.border.default,
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting MetadataList emits MetadataList.gen.css.ts and MetadataList.gen.tsx", () => {
//     const files = generate(metadataListConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/metadata-list/MetadataList.gen.css.ts");
//     expect(filenames).toContain("components/metadata-list/MetadataList.gen.tsx");
//   });
//
//   test("MetadataList.gen.tsx renders dt/dd pairs inside a dl, columns driven by a CSS var", () => {
//     const files = generate(metadataListConfig());
//     const component = files.find(
//       (f) => f.filename === "components/metadata-list/MetadataList.gen.tsx",
//     )!;
//     expect(component.content).toMatch(/renderElement\("dl", render, rootProps/);
//     expect(component.content).toMatch(/<dt className={metadataListLabel}>/);
//     expect(component.content).toMatch(/<dd className={metadataListValue}>/);
//     expect(component.content).toMatch(/"--metadata-list-columns": columns/);
//   });
//
//   test("missing MetadataList bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { MetadataList: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "gaps"/);
//   });
//
//   test("MetadataList generated sources pass assertParses", () => {
//     const files = generate(metadataListConfig());
//     for (const suffix of [
//       "components/metadata-list/MetadataList.gen.css.ts",
//       "components/metadata-list/MetadataList.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("TreeList built-in component", () => {
//   function treeListConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { inner: tokens.dimension("4px") },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//       },
//     });
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         TreeList: {
//           typography: system.textStyles.body,
//           color: ref.color.black,
//           hoverBackgroundColor: ref.color.white,
//           selectedBackgroundColor: ref.color.white,
//           selectedColor: ref.color.black,
//           borderRadius: system.radius.inner,
//           indentSpacing: system.spacing.md,
//           rowHorizontalSpacing: system.spacing.md,
//           rowVerticalSpacing: system.spacing.sm,
//           rowGap: system.spacing.sm,
//           guideColor: ref.color.black,
//           iconSize: system.spacing.md,
//           iconColor: ref.color.black,
//           expandIcon: "chevronDown",
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting TreeList emits TreeList.gen.css.ts and TreeList.gen.tsx", () => {
//     const files = generate(treeListConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/tree-list/TreeList.gen.css.ts");
//     expect(filenames).toContain("components/tree-list/TreeList.gen.tsx");
//   });
//
//   test("TreeList.gen.tsx recursively renders a treeitem/group ARIA tree with controlled/uncontrolled expansion", () => {
//     const files = generate(treeListConfig());
//     const component = files.find((f) => f.filename === "components/tree-list/TreeList.gen.tsx")!;
//     expect(component.content).toMatch(/role: "tree",/);
//     expect(component.content).toMatch(/role="treeitem"/);
//     expect(component.content).toMatch(
//       /const \[uncontrolledExpandedIds, setUncontrolledExpandedIds\]/,
//     );
//     expect(component.content).toMatch(/function TreeListGroup<Value>\(/);
//   });
//
//   test("missing TreeList bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { TreeList: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "typography"/);
//   });
//
//   test("TreeList generated sources pass assertParses", () => {
//     const files = generate(treeListConfig());
//     for (const suffix of [
//       "components/tree-list/TreeList.gen.css.ts",
//       "components/tree-list/TreeList.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("Timeline built-in component", () => {
//   function timelineConfig() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//         supporting: tokens.typography({
//           fontFamily: "Arial",
//           fontSize: "12px",
//           fontWeight: "regular",
//         }),
//       },
//     });
//     const statusFields = {
//       indicatorColor: ref.color.black,
//       indicatorBackgroundColor: ref.color.white,
//       indicatorBorder: system.border.default,
//     };
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Timeline: {
//           connectorColor: ref.color.black,
//           connectorThickness: system.spacing.sm,
//           connectorSpacing: system.spacing.sm,
//           labelTypography: system.textStyles.body,
//           labelColor: ref.color.black,
//           descriptionTypography: system.textStyles.supporting,
//           descriptionColor: ref.color.black,
//           timestampTypography: system.textStyles.supporting,
//           timestampColor: ref.color.black,
//           itemGap: system.spacing.sm,
//           iconSize: system.spacing.md,
//           statuses: {
//             neutral: statusFields,
//           },
//           sizes: {
//             md: {
//               indicatorSize: system.spacing.md,
//               gap: system.spacing.sm,
//               typography: system.textStyles.body,
//             },
//           },
//         },
//       },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     return { config, output };
//   }
//
//   test("selecting Timeline emits Timeline.gen.css.ts and Timeline.gen.tsx", () => {
//     const files = generate(timelineConfig());
//     const filenames = files.map((file) => file.filename);
//     expect(filenames).toContain("components/timeline/Timeline.gen.css.ts");
//     expect(filenames).toContain("components/timeline/Timeline.gen.tsx");
//   });
//
//   test("Timeline.gen.tsx derives status/size union types from consumer-defined variant keys and formats timestamps", () => {
//     const files = generate(timelineConfig());
//     const component = files.find((f) => f.filename === "components/timeline/Timeline.gen.tsx")!;
//     expect(component.content).toMatch(/export type TimelineStatusToken = "neutral";/);
//     expect(component.content).toMatch(/export type TimelineSize = "md";/);
//     expect(component.content).toMatch(/function defaultFormatTimestamp\(/);
//     expect(component.content).toMatch(/renderElement\("ol", render, rootProps/);
//   });
//
//   test("missing Timeline bindings throw MissingDesignTokensError", () => {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//     });
//     const config = defineConfig({
//       tokens: { ref, system: defineSystemTokens({}), components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Timeline: {} } as never,
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     expect(() => generate({ config, output })).toThrow(MissingDesignTokensError);
//     expect(() => generate({ config, output })).toThrow(/requires config "statuses"/);
//   });
//
//   test("Timeline generated sources pass assertParses", () => {
//     const files = generate(timelineConfig());
//     for (const suffix of [
//       "components/timeline/Timeline.gen.css.ts",
//       "components/timeline/Timeline.gen.tsx",
//     ]) {
//       const file = files.find((f) => f.filename === suffix)!;
//       expect(file).toBeDefined();
//       assertParses(file.content, suffix);
//     }
//   });
// });
//
// describe("focus ring", () => {
//   function focusRingBaseTokens() {
//     const ref = defineReferenceTokens({
//       __veColor: tokens.color("#000000"),
//       __veFontFamily: tokens.fontFamily("Arial"),
//       color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
//     });
//     const system = defineSystemTokens({
//       radius: { element: tokens.dimension("8px"), inner: tokens.dimension("4px") },
//       border: { default: tokens.border({ color: ref.color.black, width: "1px" }) },
//       textStyles: {
//         body: tokens.typography({ fontFamily: "Arial", fontSize: "14px", fontWeight: "regular" }),
//       },
//       spacing: { sm: tokens.dimension("4px"), md: tokens.dimension("8px") },
//       elevation: {
//         md: tokens.shadow({
//           color: ref.color.black,
//           offsetX: "0px",
//           offsetY: "2px",
//           blur: "4px",
//           spread: "0px",
//         }),
//       },
//     });
//     return { ref, system };
//   }
//
//   function buttonBuiltInComponents(
//     ref: ReturnType<typeof focusRingBaseTokens>["ref"],
//     system: ReturnType<typeof focusRingBaseTokens>["system"],
//   ) {
//     return {
//       borderRadius: system.radius.element,
//       variants: {
//         primary: {
//           backgroundColor: ref.color.black,
//           color: ref.color.white,
//           typography: system.textStyles.body,
//           border: system.border.default,
//           hoverBackgroundColor: ref.color.black,
//           hoverColor: ref.color.white,
//           hoverBorder: system.border.default,
//           disabledBackgroundColor: ref.color.black,
//           disabledColor: ref.color.white,
//           disabledBorder: system.border.default,
//         },
//       },
//       sizes: {
//         md: {
//           horizontalSpacing: system.spacing.md,
//           verticalSpacing: system.spacing.sm,
//           typography: system.textStyles.body,
//           gap: system.spacing.sm,
//         },
//       },
//     };
//   }
//
//   function dropdownButtonBuiltInComponents(
//     ref: ReturnType<typeof focusRingBaseTokens>["ref"],
//     system: ReturnType<typeof focusRingBaseTokens>["system"],
//   ) {
//     return {
//       ...buttonBuiltInComponents(ref, system),
//       popupBackgroundColor: ref.color.white,
//       popupBorder: system.border.default,
//       popupBorderRadius: system.radius.element,
//       popupShadow: system.elevation.md,
//       popupSpacing: system.spacing.sm,
//       popupOffset: system.spacing.sm,
//       itemColor: ref.color.black,
//       itemTypography: system.textStyles.body,
//       itemHoverBackgroundColor: ref.color.white,
//       itemDisabledColor: ref.color.black,
//       itemHorizontalSpacing: system.spacing.md,
//       itemVerticalSpacing: system.spacing.sm,
//       itemIconSize: system.spacing.md,
//       indicatorIcon: "chevronDown" as const,
//     };
//   }
//
//   function treeListBuiltInComponents(
//     ref: ReturnType<typeof focusRingBaseTokens>["ref"],
//     system: ReturnType<typeof focusRingBaseTokens>["system"],
//   ) {
//     return {
//       typography: system.textStyles.body,
//       color: ref.color.black,
//       hoverBackgroundColor: ref.color.white,
//       selectedBackgroundColor: ref.color.white,
//       selectedColor: ref.color.black,
//       borderRadius: system.radius.inner,
//       indentSpacing: system.spacing.md,
//       rowHorizontalSpacing: system.spacing.md,
//       rowVerticalSpacing: system.spacing.sm,
//       rowGap: system.spacing.sm,
//       guideColor: ref.color.black,
//       iconSize: system.spacing.md,
//       iconColor: ref.color.black,
//       expandIcon: "chevronDown" as const,
//     };
//   }
//
//   test("with focusRingColor set, Button.gen.css.ts emits outline: none and a flush box-shadow ring", () => {
//     const { ref, system } = focusRingBaseTokens();
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { Button: buttonBuiltInComponents(ref, system) },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     const files = generate({ config, output });
//     const styles = files.find((f) => f.filename === "components/button/Button.gen.css.ts")!;
//     expect(styles.content).toMatch(/outline: "none",/);
//     expect(styles.content).toMatch(/boxShadow: `0 0 0 2px \$\{vars\.ref\.__veColor\}`,/);
//   });
//
//   test("with focusRingColor omitted, no generated component file contains a focus ring", () => {
//     const { ref, system } = focusRingBaseTokens();
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: {
//         Button: buttonBuiltInComponents(ref, system),
//         DropdownButton: dropdownButtonBuiltInComponents(ref, system),
//         TreeList: treeListBuiltInComponents(ref, system),
//       },
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     const files = generate({ config, output });
//     for (const file of files) {
//       if (!file.filename.endsWith(".gen.css.ts")) continue;
//       expect(file.content).not.toMatch(/:focus-visible/);
//       expect(file.content).not.toMatch(/:focus-within/);
//     }
//   });
//
//   test("DropdownButton.gen.css.ts never emits a ring on dropdownButtonItem", () => {
//     const { ref, system } = focusRingBaseTokens();
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { DropdownButton: dropdownButtonBuiltInComponents(ref, system) },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     const files = generate({ config, output });
//     const styles = files.find(
//       (f) => f.filename === "components/dropdown-button/DropdownButton.gen.css.ts",
//     )!;
//     const itemStart = styles.content.indexOf("dropdownButtonItem");
//     const itemBlock = styles.content.slice(itemStart, styles.content.indexOf("});", itemStart));
//     expect(itemBlock).not.toMatch(/boxShadow/);
//   });
//
//   test("TreeList.gen.css.ts uses an inset ring", () => {
//     const { ref, system } = focusRingBaseTokens();
//     const config = defineConfig({
//       tokens: { ref, system, components: {} },
//     });
//     const output: VanillaExtractPluginOptions = {
//       outDir: "dist-test",
//       builtInComponents: { TreeList: treeListBuiltInComponents(ref, system) },
//       focusRingColor: ref.__veColor,
//       fontFamily: ref.__veFontFamily,
//       placeholderColor: ref.__veColor,
//     };
//     const files = generate({ config, output });
//     const styles = files.find((f) => f.filename === "components/tree-list/TreeList.gen.css.ts")!;
//     expect(styles.content).toMatch(/boxShadow: `inset 0 0 0 2px \$\{vars\.ref\.__veColor\}`,/);
//   });
// });
