import { describe, expect, test } from "@jest/globals";
import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "../src/index.js";
import {
  generateTypeScriptFiles,
  type TypeScriptPluginOptions,
} from "../src/outputs/typescript.js";
import {
  generateTypeScriptNativeFiles,
  type TypeScriptNativePluginOptions,
} from "../src/outputs/typescript-native.js";
import {
  generateVanillaExtractFiles,
  type VanillaExtractPluginOptions,
} from "../src/plugins/vanilla-extract/generate.js";
import { generateCss } from "../src/outputs/css.js";
import { generateStylexFiles } from "../src/outputs/stylex.js";
import type { Config } from "@recontentapp/core";

function configWithTheme(themeName: string): Config {
  const ref = defineReferenceTokens({
    color: { black: tokens.color("#000000") },
    fontFamily: { body: tokens.fontFamily("Arial") },
  });
  const theme = defineTheme(ref, { color: { black: tokens.color("#111111") } });
  return defineConfig({
    tokens: { ref, system: defineSystemTokens({}), components: {} },
    themes: { [themeName]: theme },
  });
}

describe("typescript target", () => {
  const TS: TypeScriptPluginOptions = { outDir: "dist-test" };

  test('a theme named "dark-mode" throws (not a valid identifier)', () => {
    const config = configWithTheme("dark-mode");
    expect(() => generateTypeScriptFiles(config, TS)).toThrow(
      /Theme name "dark-mode" cannot be used with the "typescript" output target: theme names must be valid TypeScript identifiers\./,
    );
  });

  test('a theme named "theme" throws (collides with the base theme const)', () => {
    const config = configWithTheme("theme");
    expect(() => generateTypeScriptFiles(config, TS)).toThrow(
      /identifier "theme" collides with a reserved export name/,
    );
  });

  test('a theme named "themeRef" throws (collides with the base layer const)', () => {
    const config = configWithTheme("themeRef");
    expect(() => generateTypeScriptFiles(config, TS)).toThrow(
      /identifier "themeRef" collides with a reserved export name/,
    );
  });

  test("duplicate scale typeName throws, naming both paths", () => {
    const ref = defineReferenceTokens({
      spacing: tokens.dimensionScale({ 0: "0px", 1: "4px" }),
      "spacing!": tokens.dimensionScale({ 0: "0px", 1: "4px" }),
    });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    expect(() => generateTypeScriptFiles(config, TS)).toThrow(
      /Scale export name "RefSpacing" collides between token paths/,
    );
  });
});

describe("typescript-native target", () => {
  const NATIVE: TypeScriptNativePluginOptions = { outDir: "dist-test" };

  test('a theme named "dark-mode" throws', () => {
    const config = configWithTheme("dark-mode");
    expect(() => generateTypeScriptNativeFiles(config, NATIVE)).toThrow(
      /theme names must be valid TypeScript identifiers\./,
    );
  });

  test('a theme named "theme" throws', () => {
    const config = configWithTheme("theme");
    expect(() => generateTypeScriptNativeFiles(config, NATIVE)).toThrow(
      /identifier "theme" collides with a reserved export name/,
    );
  });
});

describe("vanilla-extract target", () => {
  const veRef = defineReferenceTokens({
    color: { black: tokens.color("#000000") },
    fontFamily: { body: tokens.fontFamily("Arial") },
  });
  const VE: VanillaExtractPluginOptions = {
    outDir: "dist-test",
    focusRingColor: veRef.color.black,
    fontFamily: veRef.fontFamily.body,
    placeholderColor: veRef.color.black,
  };

  test('a theme named "dark-mode" throws (not a valid identifier)', () => {
    const config = configWithTheme("dark-mode");
    expect(() => generateVanillaExtractFiles(config, VE)).toThrow(
      /Theme name "dark-mode" cannot be used with the "vanilla-extract" output target/,
    );
  });

  test('a theme named "dark_mode" does not throw', () => {
    const config = configWithTheme("dark_mode");
    expect(() => generateVanillaExtractFiles(config, VE)).not.toThrow();
  });
});

describe("css target", () => {
  test("a theme named 'x\" { }' throws (CSS selector injection)", () => {
    const config = configWithTheme('x" { } .evil {');
    expect(() => generateCss(config)).toThrow(
      /Theme name .* cannot be used with the "css" output target/,
    );
  });

  test('a theme named "dark-mode" does not throw (hyphens are valid CSS identifiers)', () => {
    const config = configWithTheme("dark-mode");
    expect(() => generateCss(config)).not.toThrow();
  });

  test("a themeAttribute containing a quote throws", () => {
    const config = configWithTheme("dark");
    expect(() => generateCss(config, { themeAttribute: 'data-theme"]{color:red}[x=' })).toThrow(
      /themeAttribute .* cannot be used with the "css" output target/,
    );
  });
});

describe("stylex target", () => {
  const STYLEX = {
    outDir: "dist-test",
    fontFamily: undefined as never,
    placeholderColor: undefined as never,
  };

  test('a theme named "dark-mode" throws (not a valid identifier)', () => {
    const ref = defineReferenceTokens({
      color: { black: tokens.color("#000000") },
      fontFamily: { body: tokens.fontFamily("Arial") },
    });
    const theme = defineTheme(ref, { color: { black: tokens.color("#111111") } });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
      themes: { "dark-mode": theme },
    });
    expect(() =>
      generateStylexFiles(config, {
        ...STYLEX,
        fontFamily: ref.fontFamily.body,
        placeholderColor: ref.color.black,
      }),
    ).toThrow(/Theme name "dark-mode" cannot be used with the "stylex" output target/);
  });
});
