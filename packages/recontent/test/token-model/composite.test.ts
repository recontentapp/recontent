import { expect, test } from "@jest/globals";
import {
  compositeMembers,
  isCompositeType,
  isExpandedComposite,
} from "../../src/token-model/composite.js";
import type { GradientValue, ShadowValue, TokenMember } from "../../src/token-model/values.js";

function member<T>(value: T): TokenMember<any> {
  return { $value: value } as TokenMember<any>;
}

test("isCompositeType recognizes composite token types", () => {
  for (const type of ["shadow", "border", "transition", "gradient", "typography"] as const) {
    expect(isCompositeType(type)).toBe(true);
  }
  expect(isCompositeType("color")).toBe(false);
});

test("isExpandedComposite recognizes only typography and transition", () => {
  expect(isExpandedComposite("typography")).toBe(true);
  expect(isExpandedComposite("transition")).toBe(true);
  expect(isExpandedComposite("shadow")).toBe(false);
  expect(isExpandedComposite("border")).toBe(false);
  expect(isExpandedComposite("gradient")).toBe(false);
});

test("compositeMembers expands a shadow layer into its color/dimension members", () => {
  const shadow: ShadowValue = {
    layers: [
      {
        color: member({ colorSpace: "srgb" }),
        offsetX: member({ value: 0, unit: "px" }),
        offsetY: member({ value: 2, unit: "px" }),
        blur: member({ value: 4, unit: "px" }),
        spread: member({ value: 0, unit: "px" }),
      },
    ],
  };
  const members = compositeMembers("shadow", shadow);
  expect(members.map((m) => m.key)).toEqual([
    "layers.0.color",
    "layers.0.offsetX",
    "layers.0.offsetY",
    "layers.0.blur",
    "layers.0.spread",
  ]);
  expect(members.map((m) => m.type)).toEqual([
    "color",
    "dimension",
    "dimension",
    "dimension",
    "dimension",
  ]);
});

test("compositeMembers treats a shadow layer alias as a single shadow member", () => {
  const shadow: ShadowValue = { layers: [member({ layers: [] }) as TokenMember<"shadow">] };
  const members = compositeMembers("shadow", shadow);
  expect(members).toEqual([{ key: "layers.0", type: "shadow", member: shadow.layers[0] }]);
});

test("compositeMembers expands gradient stops", () => {
  const gradient: GradientValue = {
    kind: "linear",
    angle: "90deg",
    stops: [
      { color: member({ colorSpace: "srgb" }), position: member({ value: 0 }) },
      { color: member({ colorSpace: "srgb" }), position: member({ value: 1 }) },
    ],
  };
  const members = compositeMembers("gradient", gradient);
  expect(members.map((m) => m.key)).toEqual([
    "stops.0.color",
    "stops.0.position",
    "stops.1.color",
    "stops.1.position",
  ]);
});

test("compositeMembers treats a gradient stop alias as a single gradient member", () => {
  const stopAlias = member({ kind: "linear", angle: "0deg", stops: [] }) as TokenMember<"gradient">;
  const gradient: GradientValue = { kind: "linear", angle: "0deg", stops: [stopAlias] };
  const members = compositeMembers("gradient", gradient);
  expect(members).toEqual([{ key: "stops.0", type: "gradient", member: stopAlias }]);
});
