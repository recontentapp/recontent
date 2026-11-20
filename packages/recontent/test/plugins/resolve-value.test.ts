import { expect, test } from "@jest/globals";
import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "../../src/index.js";
import { aliasChain, resolveValue } from "../../src/plugins/index.js";

function fixture() {
  const ref = defineReferenceTokens({
    color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
  });
  const system = defineSystemTokens({ color: { text: ref.color.black } });
  const dark = defineTheme(ref, { color: { black: tokens.color("#eeeeee") } });
  const repointed = defineTheme(system, { color: { text: ref.color.white } });
  const config = defineConfig({
    tokens: { ref, system, components: {} },
    themes: { dark, repointed },
  });
  return { config };
}

const hexOf = (value: unknown) => (value as { hex: string }).hex;
const pathsOf = (chain: { path: string[] }[]) => chain.map((entry) => entry.path.join("."));

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

test("aliasChain lists each entry from the token to its terminal entry", () => {
  const { config } = fixture();
  const chain = aliasChain(config, config.registry.get("system.color.text")!);

  expect(pathsOf(chain)).toEqual(["system.color.text", "ref.color.black"]);
  expect(hexOf(chain.at(-1)!.$value)).toBe("#000000");
});

test("aliasChain returns a one-element chain for a plain token", () => {
  const { config } = fixture();
  expect(pathsOf(aliasChain(config, config.registry.get("ref.color.white")!))).toEqual([
    "ref.color.white",
  ]);
});

test("aliasChain applies a theme override on an entry along the chain", () => {
  const { config } = fixture();
  const chain = aliasChain(config, config.registry.get("system.color.text")!, "dark");

  expect(pathsOf(chain)).toEqual(["system.color.text", "ref.color.black"]);
  expect(hexOf(chain.at(-1)!.$value)).toBe("#eeeeee");
});

test("aliasChain follows a theme override that re-points an alias", () => {
  const { config } = fixture();
  const chain = aliasChain(config, config.registry.get("system.color.text")!, "repointed");

  expect(pathsOf(chain)).toEqual(["system.color.text", "ref.color.white"]);
  expect(hexOf(chain.at(-1)!.$value)).toBe("#ffffff");
});

test.each([
  ["resolveValue", resolveValue],
  ["aliasChain", aliasChain],
])("%s throws on an unknown theme, listing the available ones", (_name, fn) => {
  const { config } = fixture();
  expect(() => fn(config, config.registry.get("ref.color.white")!, "nope")).toThrow(
    'Theme "nope" is not defined in the config. Available themes: dark, repointed',
  );
});
