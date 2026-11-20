import { expect, test } from "@jest/globals";
import {
  css,
  designMD,
  docs,
  dtcg,
  stylex,
  tailwind,
  typescript,
  typescriptNative,
  vanillaExtract,
} from "../../src/plugins/index.js";
import type { PluginContext, RecontentPlugin } from "../../src/plugins/types.js";
import { themedConfig } from "../helpers/fixtures.js";

const { config } = themedConfig({ layer: "ref" });

function ctx(): PluginContext {
  return {
    registry: config.registry,
    groups: config.groups,
    themes: config.themes,
    root: "/project",
    logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
  };
}

test.each<[string, (outDir: string) => RecontentPlugin, string[]]>([
  ["css", (outDir) => css({ outDir }), ["tokens.css"]],
  ["typescript", (outDir) => typescript({ outDir }), ["tokens.ts"]],
  ["typescriptNative", (outDir) => typescriptNative({ outDir }), ["tokens.ts"]],
  ["stylex", (outDir) => stylex({ outDir }), ["tokens.stylex.ts", "themes.ts", "scales.ts"]],
  ["vanillaExtract", (outDir) => vanillaExtract({ outDir }), ["tokens.css.ts"]],
  ["dtcg", (outDir) => dtcg({ outDir }), ["tokens.tokens.json", "dark.tokens.json"]],
  ["docs", (outDir) => docs({ outDir }), ["design.html"]],
  ["designMD", (outDir) => designMD({ outDir }), ["DESIGN.md"]],
  ["tailwind", (outDir) => tailwind({ outDir }), ["tailwind.css"]],
])("%s() emits exactly these files under outDir", async (_name, plugin, filenames) => {
  const files = await plugin("src/generated").generate!(ctx());

  expect(files.map((file) => file.path)).toEqual(filenames.map((name) => `src/generated/${name}`));
});
