import { expect, test } from "@jest/globals";
import type { TokenEntry, TokenRegistry } from "@recontentapp/core";
import { diagnoseRegistry } from "../src/core/registry-diagnostics.js";

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
  expect(diagnoseRegistry(registry)).toEqual([]);
});

test("diagnoseRegistry returns nothing when aliases resolve", () => {
  const registry: TokenRegistry = new Map([
    ["ref.color.blue", entry(["ref", "color", "blue"])],
    [
      "system.color.primary",
      entry(["system", "color", "primary"], { alias: ["ref", "color", "blue"], layer: "system" }),
    ],
  ]);
  expect(diagnoseRegistry(registry)).toEqual([]);
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
  const diagnostics = diagnoseRegistry(registry);
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
  const diagnostics = diagnoseRegistry(registry);
  expect(diagnostics.some((d) => d.message.includes("Circular alias"))).toBe(true);
});
