import { describe, expect, test } from "@jest/globals";
import { generateCss } from "../src/outputs/css.js";
import { generateTypeScriptFiles } from "../src/outputs/typescript.js";
import { generateTypeScriptNativeFiles } from "../src/outputs/typescript-native.js";
import { generateStylexFiles } from "../src/outputs/stylex.js";
import { generateVanillaExtractFiles } from "../src/plugins/vanilla-extract/generate.js";
import { generateDtcg, generateDtcgThemed } from "../src/outputs/dtcg.js";
import { goldenConfig } from "./helpers/fixtures.js";
import type { OutputFile } from "@recontentapp/core";

/**
 * One config exercising every token kind and layer, and 2 themes overriding
 * different layers (see goldenConfig), snapshotted through every output
 * plugin. This is a regression net, not a spec: intentional generator
 * changes require re-running with `--ci=false -u` and reviewing the diff.
 */

function joinFiles(files: OutputFile[]): string {
  return files.map((file) => `// ---- ${file.filename} ----\n${file.content}`).join("\n\n");
}

describe("golden snapshots", () => {
  test("css", () => {
    const { config } = goldenConfig();
    expect(generateCss(config)).toMatchSnapshot();
  });

  test("typescript", () => {
    const { config } = goldenConfig();
    expect(joinFiles(generateTypeScriptFiles(config, { outDir: "dist-test" }))).toMatchSnapshot();
  });

  test("typescript-native", () => {
    const { config } = goldenConfig();
    expect(
      joinFiles(generateTypeScriptNativeFiles(config, { outDir: "dist-test" })),
    ).toMatchSnapshot();
  });

  test("stylex", () => {
    const { config, ref } = goldenConfig();
    expect(
      joinFiles(
        generateStylexFiles(config, {
          outDir: "dist-test",
          fontFamily: ref.fontFamily.body,
          placeholderColor: ref.color.black,
        }),
      ),
    ).toMatchSnapshot();
  });

  test("vanilla-extract", () => {
    const { config, ref } = goldenConfig();
    expect(
      joinFiles(
        generateVanillaExtractFiles(config, {
          outDir: "dist-test",
          fontFamily: ref.fontFamily.body,
          placeholderColor: ref.color.black,
        }),
      ),
    ).toMatchSnapshot();
  });

  test("dtcg (base)", () => {
    const { config } = goldenConfig();
    expect(generateDtcg(config)).toMatchSnapshot();
  });

  test("dtcg (themed: dark)", () => {
    const { config } = goldenConfig();
    expect(generateDtcgThemed(config, "dark")).toMatchSnapshot();
  });

  test("dtcg (themed: highContrast)", () => {
    const { config } = goldenConfig();
    expect(generateDtcgThemed(config, "highContrast")).toMatchSnapshot();
  });
});
