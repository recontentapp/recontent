import assert from "node:assert/strict";
import test from "node:test";
import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "../dist/index.mjs";
import { generateCss } from "../dist/outputs/css.mjs";
import { vanillaExtractOutputProcessor } from "../dist/outputs/vanilla-extract.mjs";

function shadowConfig(themes = {}) {
  const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
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
  return defineConfig({
    tokens: { ref, system, components: {} },
    themes,
    output: { target: "vanilla-extract", outDir: "dist-test" },
  });
}

function typographyConfig() {
  const ref = defineReferenceTokens({});
  const system = defineSystemTokens({
    typography: {
      body: tokens.typography({ fontFamily: "Arial", fontSize: "16px", fontWeight: "regular" }),
    },
  });
  return defineConfig({
    tokens: { ref, system, components: {} },
    output: { target: "vanilla-extract", outDir: "dist-test" },
  });
}

test("css output emits one declaration per expanded typography member", () => {
  const config = typographyConfig();
  const css = generateCss(config);
  assert.match(css, /--system-typography-body-font-family: Arial;/);
  assert.match(css, /--system-typography-body-font-size: 16px;/);
  assert.match(css, /--system-typography-body-font-weight: 400;/);
});

test("css output emits a single declaration for an inline shadow", () => {
  const config = shadowConfig();
  const css = generateCss(config);
  assert.match(css, /--system-shadow-card: 0px 2px 4px 0px var\(--ref-color-black\);/);
});

test("vanilla-extract contract nests expanded composite members", () => {
  const config = typographyConfig();
  const [file] = vanillaExtractOutputProcessor.generate(config, config.output[0]);
  assert.match(file.content, /"typography":\s*{\s*"body":\s*{\s*"fontFamily": null,/);
});

test("vanilla-extract emits a template literal for an inline shadow with an aliased color", () => {
  const config = shadowConfig();
  const [file] = vanillaExtractOutputProcessor.generate(config, config.output[0]);
  assert.match(file.content, /"card": `0px 2px 4px 0px \$\{vars\.ref\.color\.black\}`,/);
});

test("a theme overriding a ref color re-themes a shadow through a member alias", () => {
  const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
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
    output: { target: "vanilla-extract", outDir: "dist-test" },
  });
  const [file] = vanillaExtractOutputProcessor.generate(config, config.output[0]);
  const darkBlock = file.content.slice(file.content.indexOf("darkThemeClass"));
  assert.match(darkBlock, /"card": "0px 2px 4px 0px #111111",/);
});
