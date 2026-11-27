import { expect, test } from "@jest/globals";
import type {
  ThemeAxis,
  ThemeOverride,
  TokenEntry,
  TokenRegistry,
} from "../../src/token-model/registry.js";
import { diagnoseRegistry, resolveEntryValue, terminalEntry } from "../../src/token-model/alias.js";

function entry(path: string[], overrides: Partial<TokenEntry> = {}): TokenEntry {
  return {
    path,
    $type: "color",
    $value: { colorSpace: "srgb", components: [0, 0, 0], alpha: 1, hex: "#000000" },
    layer: "ref",
    ...overrides,
  };
}

function singleAxis(contexts: Record<string, ThemeOverride>): ThemeAxis[] {
  return [{ name: "theme", default: "default", contexts }];
}

test("diagnoseRegistry returns nothing for a registry with no aliases", () => {
  const registry: TokenRegistry = new Map([["ref.color.blue", entry(["ref", "color", "blue"])]]);
  expect(diagnoseRegistry(registry, [])).toEqual([]);
});

test("diagnoseRegistry returns nothing when aliases resolve", () => {
  const registry: TokenRegistry = new Map([
    ["ref.color.blue", entry(["ref", "color", "blue"])],
    [
      "system.color.primary",
      entry(["system", "color", "primary"], { alias: ["ref", "color", "blue"], layer: "system" }),
    ],
  ]);
  expect(diagnoseRegistry(registry, [])).toEqual([]);
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
  const diagnostics = diagnoseRegistry(registry, []);
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
  const diagnostics = diagnoseRegistry(registry, []);
  expect(diagnostics.some((d) => d.message.includes("Circular alias"))).toBe(true);
});

test("diagnoseRegistry flags a theme override of a token that does not exist", () => {
  const registry: TokenRegistry = new Map([["ref.color.blue", entry(["ref", "color", "blue"])]]);
  const themes = singleAxis({
    dark: new Map([
      ["ref.color.blue", { $value: entry([]).$value }],
      ["ref.color.nope", { $value: entry([]).$value }],
    ]),
  });

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

const hex = (value: string) => ({
  colorSpace: "srgb" as const,
  components: [0, 0, 0] as [number, number, number],
  alpha: 1,
  hex: value,
});

test("a themed walk follows the theme's aliases and stops at its literals", () => {
  const ref = (name: string, value: string) =>
    entry(["ref", "color", name], { $value: hex(value) });
  const registry: TokenRegistry = new Map([
    ["ref.color.light", ref("light", "#ffffff")],
    ["ref.color.dark", ref("dark", "#111111")],
    ["ref.color.accent", ref("accent", "#ff0000")],
    [
      "system.color.surface",
      entry(["system", "color", "surface"], {
        alias: ["ref", "color", "light"],
        layer: "system",
        $value: hex("#ffffff"),
      }),
    ],
    [
      "system.color.card",
      entry(["system", "color", "card"], {
        alias: ["system", "color", "surface"],
        layer: "system",
        $value: hex("#ffffff"),
      }),
    ],
  ]);
  const card = registry.get("system.color.card")!;

  const aliased: ThemeOverride = new Map([
    ["system.color.surface", { $value: hex("#111111"), alias: ["ref", "color", "dark"] }],
  ]);
  expect(terminalEntry(registry, card, aliased).path).toEqual(["ref", "color", "dark"]);
  expect(resolveEntryValue(registry, card, aliased)).toEqual(hex("#111111"));

  // The theme overrides both ends of the chain: the alias lands on the themed value.
  const both: ThemeOverride = new Map([
    ["system.color.surface", { $value: hex("#111111"), alias: ["ref", "color", "dark"] }],
    ["ref.color.dark", { $value: hex("#222222") }],
  ]);
  expect(resolveEntryValue(registry, card, both)).toEqual(hex("#222222"));

  // A literal override ends the walk even though the base entry aliases.
  const literal: ThemeOverride = new Map([["system.color.surface", { $value: hex("#333333") }]]);
  expect(terminalEntry(registry, card, literal).path).toEqual(["system", "color", "surface"]);
  expect(resolveEntryValue(registry, card, literal)).toEqual(hex("#333333"));
});

test.each([
  [
    "a missing target",
    { $value: hex("#000000"), alias: ["ref", "color", "missing"] },
    'Theme "dark": Broken alias at "ref.color.a": target "ref.color.missing" does not exist in the registry.',
  ],
  [
    "a cycle through the base chain",
    { $value: hex("#000000"), alias: ["ref", "color", "b"] },
    'Theme "dark": Circular alias at "ref.color.a": alias chain revisits "ref.color.a".',
  ],
])("diagnoseRegistry reports a theme alias with %s", (_name, themed, message) => {
  const registry: TokenRegistry = new Map([
    ["ref.color.a", entry(["ref", "color", "a"])],
    ["ref.color.b", entry(["ref", "color", "b"], { alias: ["ref", "color", "a"] })],
  ]);

  const diagnostics = diagnoseRegistry(
    registry,
    singleAxis({ dark: new Map([["ref.color.a", themed]]) }),
  );

  expect(diagnostics.map((d) => d.message)).toEqual([message]);
});

test("diagnoseRegistry catches cross-axis alias cycles when each axis is valid in isolation", () => {
  const registry: TokenRegistry = new Map([
    ["ref.color.a", entry(["ref", "color", "a"])],
    ["ref.color.b", entry(["ref", "color", "b"])],
  ]);
  const axes: ThemeAxis[] = [
    {
      name: "brand",
      default: "core",
      contexts: {
        acme: new Map([["ref.color.a", { $value: hex("#000000"), alias: ["ref", "color", "b"] }]]),
      },
    },
    {
      name: "mode",
      default: "light",
      contexts: {
        dark: new Map([["ref.color.b", { $value: hex("#000000"), alias: ["ref", "color", "a"] }]]),
      },
    },
  ];

  const diagnostics = diagnoseRegistry(registry, axes);
  expect(diagnostics.map((d) => d.message)).toEqual([
    'Theme "brand=acme, mode=dark": Circular alias at "ref.color.a": alias chain revisits "ref.color.a".',
    'Theme "brand=acme, mode=dark": Circular alias at "ref.color.b": alias chain revisits "ref.color.b".',
  ]);
});

test("diagnoseRegistry catches cycles between base composite member aliases and themed overrides", () => {
  const borderValue = {
    color: { $value: hex("#000000"), alias: ["ref", "color", "a"] },
    width: { $value: { value: 1, unit: "px" as const } },
    style: { $value: { style: "solid" as const } },
  };
  const registry: TokenRegistry = new Map([
    [
      "system.border.card",
      { path: ["system", "border", "card"], $type: "border", $value: borderValue, layer: "system" },
    ],
    ["ref.color.a", entry(["ref", "color", "a"])],
  ]);

  const diagnostics = diagnoseRegistry(
    registry,
    singleAxis({
      dark: new Map([
        ["ref.color.a", { $value: hex("#000000"), alias: ["system", "border", "card"] }],
      ]),
    }),
  );
  expect(diagnostics.map((d) => d.message)).toEqual([
    'Theme "dark": Circular alias at "system.border.card": alias chain revisits "system.border.card".',
  ]);
});
