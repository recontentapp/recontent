import { expect, test } from "@jest/globals";
import type { ShadowLayer } from "@recontentapp/core";
import { isTokenScale } from "@recontentapp/core";
import { defineReferenceTokens, tokens } from "../src/index.js";

test("tokens.strokeStyle accepts a keyword", () => {
  const token = tokens.strokeStyle("dashed");
  expect(token.$type).toBe("strokeStyle");
  expect(token.$value).toEqual({ style: "dashed" });
});

test("tokens.strokeStyle rejects an unknown keyword", () => {
  expect(() => tokens.strokeStyle("squiggly" as never)).toThrow();
});

test("tokens.strokeStyle accepts a custom dash", () => {
  const token = tokens.strokeStyle({ dashArray: ["4px", "2px"], lineCap: "round" });
  expect(token.$value).toEqual({
    dashArray: [
      { value: 4, unit: "px" },
      { value: 2, unit: "px" },
    ],
    lineCap: "round",
  });
});

test("tokens.strokeStyle rejects an invalid lineCap", () => {
  expect(() => tokens.strokeStyle({ dashArray: ["4px"], lineCap: "bevel" as never })).toThrow();
});

test("tokens.shadow builds a single layer from raw input", () => {
  const token = tokens.shadow({
    color: "#000000",
    offsetX: "0px",
    offsetY: "2px",
    blur: "4px",
    spread: "0px",
  });
  expect(token.$type).toBe("shadow");
  expect(token.$value.layers.length).toBe(1);
  const layer = token.$value.layers[0] as ShadowLayer;
  expect(layer.color.alias).toBeUndefined();
  expect(layer.offsetY.$value).toEqual({ value: 2, unit: "px" });
});

test("tokens.shadow builds multiple layers and records member aliases", () => {
  const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
  const token = tokens.shadow([
    {
      color: ref.color.black,
      offsetX: "0px",
      offsetY: "1px",
      blur: "2px",
      spread: "0px",
      inset: true,
    },
    { color: "#111111", offsetX: "0px", offsetY: "4px", blur: "8px", spread: "0px" },
  ]);
  expect(token.$value.layers.length).toBe(2);
  const [layer0, layer1] = token.$value.layers as [ShadowLayer, ShadowLayer];
  expect(layer0.color.alias).toEqual(["ref", "color", "black"]);
  expect(layer0.inset).toBe(true);
  expect(layer1.inset).toBeUndefined();
});

test("tokens.shadow requires all layer members", () => {
  expect(() =>
    tokens.shadow({ color: "#000000", offsetX: "0px", offsetY: "0px", blur: "0px" } as never),
  ).toThrow();
});

test("tokens.border defaults style to solid", () => {
  const token = tokens.border({ color: "#000000", width: "1px" });
  expect(token.$value.style.$value).toEqual({ style: "solid" });
});

test("tokens.border requires color and width", () => {
  expect(() => tokens.border({ width: "1px" } as never)).toThrow();
});

test("tokens.transition defaults delay to 0ms", () => {
  const token = tokens.transition({ duration: "200ms", timingFunction: [0.4, 0, 0.2, 1] });
  expect(token.$value.delay.$value).toEqual({ value: 0, unit: "ms" });
});

test("tokens.transition requires duration and timingFunction", () => {
  expect(() => tokens.transition({ duration: "200ms" } as never)).toThrow();
});

test("tokens.gradient requires at least 2 stops", () => {
  expect(() => tokens.gradient({ stops: [{ color: "#000000", position: 0 }] })).toThrow();
});

test("tokens.gradient clamps out-of-range stop positions", () => {
  const token = tokens.gradient({
    stops: [
      { color: "#000000", position: -0.1 },
      { color: "#ffffff", position: 1.5 },
    ],
  });
  const [first, second] = token.$value.stops as unknown as [
    { position: { $value: { value: number } } },
    { position: { $value: { value: number } } },
  ];
  expect(first.position.$value.value).toBe(0);
  expect(second.position.$value.value).toBe(1);
});

test("tokens.gradient defaults kind and angle", () => {
  const token = tokens.gradient({
    stops: [
      { color: "#000000", position: 0 },
      { color: "#ffffff", position: 1 },
    ],
  });
  expect(token.$value.kind).toBe("linear");
  expect(token.$value.angle).toBe("180deg");
});

test("tokens.typography requires fontFamily, fontSize, and fontWeight", () => {
  expect(() => tokens.typography({ fontFamily: "Arial", fontSize: "16px" } as never)).toThrow();
});

test("tokens.typography defaults letterSpacing and lineHeight", () => {
  const token = tokens.typography({ fontFamily: "Arial", fontSize: "16px", fontWeight: "regular" });
  expect(token.$value.letterSpacing.$value).toEqual({ value: 0, unit: "px" });
  expect(token.$value.lineHeight.$value.value).toBe(1.4);
});

test("tokens.typography accepts a stamped token and records its alias", () => {
  const ref = defineReferenceTokens({ fontFamily: { body: tokens.fontFamily("Arial") } });
  const token = tokens.typography({
    fontFamily: ref.fontFamily.body,
    fontSize: "16px",
    fontWeight: "regular",
  });
  expect(token.$value.fontFamily.alias).toEqual(["ref", "fontFamily", "body"]);
});

test("tokens.borderScale builds a TokenScale with coerced steps", () => {
  const scale = tokens.borderScale({
    thin: { color: "#000000", width: "1px" },
    thick: { color: "#000000", width: "4px" },
  });
  expect(isTokenScale(scale)).toBe(true);
  expect(scale.$type).toBe("border");
  expect(Object.keys(scale)).toEqual(["thin", "thick"]);
  expect(scale.thin.$value.style.$value).toEqual({ style: "solid" });
});

test("tokens.borderScale passes through raw/stamped tokens", () => {
  const ref = defineReferenceTokens({
    border: { hairline: tokens.border({ color: "#000000", width: "1px" }) },
  });
  const raw = tokens.border({ color: "#111111", width: "2px" });
  const scale = tokens.borderScale({ hairline: ref.border.hairline, custom: raw });
  expect(scale.hairline).toBe(ref.border.hairline);
  expect(scale.custom).toBe(raw);
});

test("tokens.borderScale still throws from the singular helper on invalid input", () => {
  expect(() => tokens.borderScale({ bad: { width: "1px" } as never })).toThrow();
});

test("tokens.cubicBezierScale builds a TokenScale with coerced steps", () => {
  const scale = tokens.cubicBezierScale({
    ease: [0.25, 0.1, 0.25, 1],
    linear: [0, 0, 1, 1],
  });
  expect(isTokenScale(scale)).toBe(true);
  expect(scale.$type).toBe("cubicBezier");
  expect(Object.keys(scale)).toEqual(["ease", "linear"]);
  expect(scale.ease.$value).toEqual({ value: [0.25, 0.1, 0.25, 1] });
});

test("tokens.cubicBezierScale passes through raw/stamped tokens", () => {
  const ref = defineReferenceTokens({
    cubicBezier: { ease: tokens.cubicBezier([0.25, 0.1, 0.25, 1]) },
  });
  const raw = tokens.cubicBezier([0, 0, 1, 1]);
  const scale = tokens.cubicBezierScale({ ease: ref.cubicBezier.ease, linear: raw });
  expect(scale.ease).toBe(ref.cubicBezier.ease);
  expect(scale.linear).toBe(raw);
});

test("tokens.gradientScale builds a TokenScale with coerced steps", () => {
  const scale = tokens.gradientScale({
    fade: {
      stops: [
        { color: "#000000", position: 0 },
        { color: "#ffffff", position: 1 },
      ],
    },
  });
  expect(isTokenScale(scale)).toBe(true);
  expect(scale.$type).toBe("gradient");
  expect(Object.keys(scale)).toEqual(["fade"]);
  expect(scale.fade.$value.kind).toBe("linear");
});

test("tokens.gradientScale passes through raw/stamped tokens", () => {
  const ref = defineReferenceTokens({
    gradient: {
      fade: tokens.gradient({
        stops: [
          { color: "#000000", position: 0 },
          { color: "#ffffff", position: 1 },
        ],
      }),
    },
  });
  const scale = tokens.gradientScale({ fade: ref.gradient.fade });
  expect(scale.fade).toBe(ref.gradient.fade);
});

test("tokens.gradientScale still throws from the singular helper on invalid input", () => {
  expect(() =>
    tokens.gradientScale({ bad: { stops: [{ color: "#000000", position: 0 }] } }),
  ).toThrow();
});

test("tokens.transitionScale builds a TokenScale with coerced steps and defaults delay to 0ms", () => {
  const scale = tokens.transitionScale({
    fast: { duration: "100ms", timingFunction: [0.4, 0, 0.2, 1] },
    slow: { duration: "400ms", timingFunction: [0.4, 0, 0.2, 1] },
  });
  expect(isTokenScale(scale)).toBe(true);
  expect(scale.$type).toBe("transition");
  expect(Object.keys(scale)).toEqual(["fast", "slow"]);
  expect(scale.fast.$value.delay.$value).toEqual({ value: 0, unit: "ms" });
});

test("tokens.transitionScale passes through raw/stamped tokens", () => {
  const ref = defineReferenceTokens({
    transition: {
      fast: tokens.transition({ duration: "100ms", timingFunction: [0.4, 0, 0.2, 1] }),
    },
  });
  const scale = tokens.transitionScale({ fast: ref.transition.fast });
  expect(scale.fast).toBe(ref.transition.fast);
});

test("tokens.transitionScale still throws from the singular helper on invalid input", () => {
  expect(() => tokens.transitionScale({ bad: { duration: "100ms" } as never })).toThrow();
});
