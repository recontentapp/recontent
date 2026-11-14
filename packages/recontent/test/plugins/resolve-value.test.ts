import { expect, test } from "@jest/globals";
import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "../../src/index.js";
import { resolveValue } from "../../src/plugins/index.js";

function fixture() {
  const ref = defineReferenceTokens({
    color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
  });
  const system = defineSystemTokens({ color: { text: ref.color.black } });
  const dark = defineTheme(ref, { color: { black: tokens.color("#eeeeee") } });
  const config = defineConfig({
    tokens: { ref, system, components: {} },
    themes: { dark },
  });
  return { config };
}

const hexOf = (value: unknown) => (value as { hex: string }).hex;

test("resolveValue returns a plain token's value", () => {
  const { config } = fixture();
  expect(hexOf(resolveValue(config, config.registry.get("ref.color.white")!))).toBe("#ffffff");
});

test("resolveValue follows an alias chain to the terminal value", () => {
  const { config } = fixture();
  expect(hexOf(resolveValue(config, config.registry.get("system.color.text")!))).toBe("#000000");
});

test("resolveValue applies a theme override on an intermediate alias", () => {
  const { config } = fixture();
  const text = config.registry.get("system.color.text")!;

  expect(hexOf(resolveValue(config, text, "dark"))).toBe("#eeeeee");
  expect(hexOf(resolveValue(config, text))).toBe("#000000");
});

test("resolveValue throws on an unknown theme, listing the available ones", () => {
  const { config } = fixture();
  expect(() => resolveValue(config, config.registry.get("ref.color.white")!, "nope")).toThrow(
    'Theme "nope" is not defined in the config. Available themes: dark',
  );
});
