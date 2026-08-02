import { expect, test } from "@jest/globals";
import type { ShadowLayer } from "@recontentapp/core";
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
