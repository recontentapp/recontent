import { expect, test } from "@jest/globals";
import {
  css,
  dtcg,
  html,
  stylex,
  tailwind,
  typescript,
  typescriptNative,
  vanillaExtract,
} from "../../src/plugins/index.js";
import {
  defineReferenceTokens,
  defineSystemTokens,
  defineConfig,
  defineTheme,
  tokens,
} from "../../src/index.js";
import type { PluginContext } from "@recontentapp/core";

const ref = defineReferenceTokens({
  color: { black: tokens.color("#000000") },
  fontFamily: { body: tokens.fontFamily("Arial") },
});
const system = defineSystemTokens({});
const config = defineConfig({ tokens: { ref, system, components: {} } });

function ctx(): PluginContext {
  return {
    registry: config.registry,
    themes: config.themes,
    root: "/project",
    logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
    mode: "build",
  };
}

test("css() emits files under outDir", async () => {
  const plugin = css({ outDir: "src/generated/css" });
  const files = await plugin.generate!(ctx());
  expect(files.every((f) => f.path.startsWith("src/generated/css/"))).toBe(true);
});

test("typescript() emits files under outDir", async () => {
  const plugin = typescript({ outDir: "src/generated/ts" });
  const files = await plugin.generate!(ctx());
  expect(files.every((f) => f.path.startsWith("src/generated/ts/"))).toBe(true);
});

test("typescriptNative() emits files under outDir", async () => {
  const plugin = typescriptNative({ outDir: "src/generated/native" });
  const files = await plugin.generate!(ctx());
  expect(files.every((f) => f.path.startsWith("src/generated/native/"))).toBe(true);
});

test("stylex() emits files under outDir", async () => {
  const plugin = stylex({
    outDir: "src/generated/stylex",
    fontFamily: ref.fontFamily.body,
    placeholderColor: ref.color.black,
  });
  const files = await plugin.generate!(ctx());
  expect(files.length).toBeGreaterThan(0);
  expect(files.every((f) => f.path.startsWith("src/generated/stylex/"))).toBe(true);
});

test("vanillaExtract() emits files under outDir", async () => {
  const plugin = vanillaExtract({
    outDir: "src/generated/ve",
    fontFamily: ref.fontFamily.body,
    placeholderColor: ref.color.black,
  });
  const files = await plugin.generate!(ctx());
  expect(files.length).toBeGreaterThan(0);
  expect(files.every((f) => f.path.startsWith("src/generated/ve/"))).toBe(true);
});

test("dtcg() emits tokens.tokens.json plus one file per theme under outDir", async () => {
  const dark = defineTheme(ref, { color: { black: tokens.color("#111111") } });
  const themed = defineConfig({
    tokens: { ref, system, components: {} },
    themes: { dark },
  });
  const plugin = dtcg({ outDir: "src/generated/dtcg" });
  const files = await plugin.generate!({ ...ctx(), themes: themed.themes });
  expect(files.map((f) => f.path)).toEqual([
    "src/generated/dtcg/tokens.tokens.json",
    "src/generated/dtcg/dark.tokens.json",
  ]);
});

test("html() emits tokens.html under outDir", async () => {
  const plugin = html({ outDir: "src/generated/html" });
  const files = await plugin.generate!(ctx());
  expect(files.map((f) => f.path)).toEqual(["src/generated/html/tokens.html"]);
});

test("tailwind() emits files under outDir", async () => {
  const plugin = tailwind({ outDir: "src/generated/tailwind" });
  const files = await plugin.generate!(ctx());
  expect(files.map((f) => f.path)).toEqual(["src/generated/tailwind/tailwind.css"]);
});
