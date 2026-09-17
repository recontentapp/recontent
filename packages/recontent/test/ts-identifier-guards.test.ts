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
} from "../src/outputs/vanilla-extract.js";
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

describe("vanilla-extract is unaffected by the new guards", () => {
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

  test('a theme named "dark-mode" does not throw for vanilla-extract', () => {
    const config = configWithTheme("dark-mode");
    expect(() => generateVanillaExtractFiles(config, VE)).not.toThrow();
  });

  test('a theme named "theme" does not throw for vanilla-extract', () => {
    const config = configWithTheme("theme");
    expect(() => generateVanillaExtractFiles(config, VE)).not.toThrow();
  });
});
