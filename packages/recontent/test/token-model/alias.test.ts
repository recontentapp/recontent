import { expect, test } from "@jest/globals";
import type { TokenEntry, TokenRegistry } from "../../src/token-model/registry.js";
import { diagnoseRegistry, terminalEntry } from "../../src/token-model/alias.js";

function entry(path: string[], overrides: Partial<TokenEntry> = {}): TokenEntry {
  return {
    path,
    $type: "color",
    $value: { colorSpace: "srgb", components: [0, 0, 0], alpha: 1, hex: "#000000" },
    layer: "ref",
    ...overrides,
  };
}

test("diagnoseRegistry returns nothing for a registry with no aliases", () => {
  const registry: TokenRegistry = new Map([["ref.color.blue", entry(["ref", "color", "blue"])]]);
  expect(diagnoseRegistry(registry, {})).toEqual([]);
});

test("diagnoseRegistry returns nothing when aliases resolve", () => {
  const registry: TokenRegistry = new Map([
    ["ref.color.blue", entry(["ref", "color", "blue"])],
    [
      "system.color.primary",
      entry(["system", "color", "primary"], { alias: ["ref", "color", "blue"], layer: "system" }),
    ],
  ]);
  expect(diagnoseRegistry(registry, {})).toEqual([]);
});

test("diagnoseRegistry flags a broken alias", () => {
  const registry: TokenRegistry = new Map([
    [
      "system.color.primary",
      entry(["system", "color", "primary"], {
        alias: ["ref", "color", "missing"],
        layer: "system",
      }),
    ],
  ]);
  const diagnostics = diagnoseRegistry(registry, {});
  expect(diagnostics).toHaveLength(1);
  expect(diagnostics[0]!.message).toMatch(/Broken alias/);
  expect(diagnostics[0]!.message).toMatch(/ref.color.missing/);
});

test("diagnoseRegistry flags a circular alias chain", () => {
  const registry: TokenRegistry = new Map([
    [
      "system.color.a",
      entry(["system", "color", "a"], { alias: ["system", "color", "b"], layer: "system" }),
    ],
    [
      "system.color.b",
      entry(["system", "color", "b"], { alias: ["system", "color", "a"], layer: "system" }),
    ],
  ]);
  const diagnostics = diagnoseRegistry(registry, {});
  expect(diagnostics.some((d) => d.message.includes("Circular alias"))).toBe(true);
});

test("diagnoseRegistry flags a theme override of a token that does not exist", () => {
  const registry: TokenRegistry = new Map([["ref.color.blue", entry(["ref", "color", "blue"])]]);
  const themes = {
    dark: new Map([
      ["ref.color.blue", entry([]).$value],
      ["ref.color.nope", entry([]).$value],
    ]),
  };

  const diagnostics = diagnoseRegistry(registry, themes);

  expect(diagnostics).toHaveLength(1);
  expect(diagnostics[0]!.message).toBe(
    'Theme "dark" overrides unknown token "ref.color.nope"; it matches no token in the config.',
  );
});

test.each([
  ["a cycle", "b", /Circular alias detected at token path: ref\.color\./],
  ["a missing target", "missing", "Alias target not found: ref.color.missing"],
])("following an alias chain throws on %s", (_name, target, message) => {
  const a = entry(["ref", "color", "a"], { alias: ["ref", "color", target] });
  const registry: TokenRegistry = new Map([
    ["ref.color.a", a],
    ["ref.color.b", entry(["ref", "color", "b"], { alias: ["ref", "color", "a"] })],
  ]);

  expect(() => terminalEntry(registry, a)).toThrow(message);
});
