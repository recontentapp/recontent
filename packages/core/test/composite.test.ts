import { expect, test } from "@jest/globals";
import {
  compositeMembers,
  EXPANDED_COMPOSITE_TYPES,
  expandedMembers,
  isCompositeType,
  isExpandedComposite,
} from "../src/composite.js";
import type {
  BorderValue,
  GradientValue,
  ShadowValue,
  TokenMember,
  TransitionValue,
  TypographyValue,
} from "../src/types.js";

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

test("compositeMembers expands a border value", () => {
  const border: BorderValue = {
    color: member({ colorSpace: "srgb" }),
    width: member({ value: 1, unit: "px" }),
    style: member({ style: "solid" }),
  };
  const members = compositeMembers("border", border);
  expect(members).toEqual([
    { key: "color", type: "color", member: border.color },
    { key: "width", type: "dimension", member: border.width },
    { key: "style", type: "strokeStyle", member: border.style },
  ]);
});

test("compositeMembers expands a transition value", () => {
  const transition: TransitionValue = {
    duration: member({ value: 200, unit: "ms" }),
    delay: member({ value: 0, unit: "ms" }),
    timingFunction: member({ value: [0.4, 0, 0.2, 1] }),
  };
  const members = compositeMembers("transition", transition);
  expect(members).toEqual([
    { key: "duration", type: "duration", member: transition.duration },
    { key: "delay", type: "duration", member: transition.delay },
    { key: "timingFunction", type: "cubicBezier", member: transition.timingFunction },
  ]);
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

test("compositeMembers expands a typography value", () => {
  const typography: TypographyValue = {
    fontFamily: member({ value: ["Inter"] }),
    fontSize: member({ value: 16, unit: "px" }),
    fontWeight: member({ value: 400 }),
    letterSpacing: member({ value: 0, unit: "px" }),
    lineHeight: member({ value: 1.5 }),
  };
  const members = compositeMembers("typography", typography);
  expect(members.map((m) => m.key)).toEqual([
    "fontFamily",
    "fontSize",
    "fontWeight",
    "letterSpacing",
    "lineHeight",
  ]);
});

test("expandedMembers expands typography into CSS-property-oriented members", () => {
  const typography: TypographyValue = {
    fontFamily: member({ value: ["Inter"] }),
    fontSize: member({ value: 16, unit: "px" }),
    fontWeight: member({ value: 400 }),
    letterSpacing: member({ value: 0, unit: "px" }),
    lineHeight: member({ value: 1.5 }),
  };
  const members = expandedMembers("typography", typography);
  expect(members.map((m) => [m.cssProperty, m.varSuffix])).toEqual([
    ["fontFamily", "font-family"],
    ["fontSize", "font-size"],
    ["fontWeight", "font-weight"],
    ["letterSpacing", "letter-spacing"],
    ["lineHeight", "line-height"],
  ]);
});

test("expandedMembers expands transition into CSS-property-oriented members", () => {
  const transition: TransitionValue = {
    duration: member({ value: 200, unit: "ms" }),
    delay: member({ value: 0, unit: "ms" }),
    timingFunction: member({ value: [0.4, 0, 0.2, 1] }),
  };
  const members = expandedMembers("transition", transition);
  expect(members.map((m) => [m.cssProperty, m.varSuffix])).toEqual([
    ["transitionDuration", "transition-duration"],
    ["transitionDelay", "transition-delay"],
    ["transitionTimingFunction", "transition-timing-function"],
  ]);
});

test("EXPANDED_COMPOSITE_TYPES lists exactly typography and transition", () => {
  expect(EXPANDED_COMPOSITE_TYPES).toEqual(["typography", "transition"]);
});
