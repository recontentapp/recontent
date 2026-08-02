import { describe, expect, test } from "@jest/globals";
import { defineReferenceTokens, tokens } from "../src/index.js";
import {
  entryToDtcgNode,
  serializeValueCss,
  serializeValueDtcg,
} from "../src/core/generators/serialize.js";

test("serializeValueDtcg emits the 2025.10 dimension shape", () => {
  expect(serializeValueDtcg("dimension", tokens.dimension("16px").$value)).toEqual({
    value: 16,
    unit: "px",
  });
});

test("serializeValueDtcg emits the 2025.10 duration shape", () => {
  expect(serializeValueDtcg("duration", tokens.duration("200ms").$value)).toEqual({
    value: 200,
    unit: "ms",
  });
});

test("serializeValueDtcg emits the full color object", () => {
  const value = tokens.color("#000000").$value;
  expect(serializeValueDtcg("color", value)).toEqual(value);
});

test("serializeValueDtcg emits a strokeStyle keyword", () => {
  expect(serializeValueDtcg("strokeStyle", tokens.strokeStyle("dashed").$value)).toEqual("dashed");
});

test("serializeValueDtcg emits a border composite node with a member reference", () => {
  const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
  const border = tokens.border({ color: ref.color.black, width: "1px" });
  const node = serializeValueDtcg("border", border.$value) as Record<string, unknown>;
  expect(node.color).toBe("{ref.color.black}");
  expect(node.width).toEqual({ value: 1, unit: "px" });
  expect(node.style).toBe("solid");
});

test("serializeValueDtcg emits a single shadow layer as a bare object", () => {
  const shadow = tokens.shadow({
    color: "#000000",
    offsetX: "0px",
    offsetY: "2px",
    blur: "4px",
    spread: "0px",
  });
  const node = serializeValueDtcg("shadow", shadow.$value) as Record<string, unknown>;
  expect(Array.isArray(node)).toBe(false);
  expect(node.offsetY).toEqual({ value: 2, unit: "px" });
});

test("serializeValueDtcg emits multiple shadow layers as an array", () => {
  const shadow = tokens.shadow([
    { color: "#000000", offsetX: "0px", offsetY: "1px", blur: "2px", spread: "0px" },
    { color: "#111111", offsetX: "0px", offsetY: "4px", blur: "8px", spread: "0px" },
  ]);
  const node = serializeValueDtcg("shadow", shadow.$value) as unknown[];
  expect(node.length).toBe(2);
});

test("serializeValueDtcg emits a gradient as a bare stop array", () => {
  const gradient = tokens.gradient({
    stops: [
      { color: "#000000", position: 0 },
      { color: "#ffffff", position: 1 },
    ],
  });
  const node = serializeValueDtcg("gradient", gradient.$value) as Array<{ position: number }>;
  expect(node.length).toBe(2);
  expect(node[0]?.position).toBe(0);
});

test("entryToDtcgNode records gradient kind/angle under $extensions", () => {
  const gradient = tokens.gradient({
    kind: "radial",
    stops: [
      { color: "#000000", position: 0 },
      { color: "#ffffff", position: 1 },
    ],
  });
  const node = entryToDtcgNode({
    path: ["system", "gradient", "card"],
    $type: "gradient",
    $value: gradient.$value,
    layer: "system",
  });
  expect(node.$extensions).toEqual({ "com.recontent": { kind: "radial", angle: "180deg" } });
});

test("entryToDtcgNode records inset layers inside $value", () => {
  const shadow = tokens.shadow([
    { color: "#000000", offsetX: "0px", offsetY: "1px", blur: "2px", spread: "0px", inset: true },
  ]);
  const node = entryToDtcgNode({
    path: ["system", "shadow", "inner"],
    $type: "shadow",
    $value: shadow.$value,
    layer: "system",
  });
  expect(node.$value).toMatchObject({ inset: true });
  expect(node.$extensions).toBeUndefined();
});

test("entryToDtcgNode omits inset for shadows without inset layers", () => {
  const shadow = tokens.shadow({
    color: "#000000",
    offsetX: "0px",
    offsetY: "2px",
    blur: "4px",
    spread: "0px",
  });
  const node = entryToDtcgNode({
    path: ["system", "shadow", "card"],
    $type: "shadow",
    $value: shadow.$value,
    layer: "system",
  });
  expect(node.$value).not.toHaveProperty("inset");
  expect(node.$extensions).toBeUndefined();
});

test("serializeValueCss renders an inline shadow with an aliased color", () => {
  const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
  const shadow = tokens.shadow({
    color: ref.color.black,
    offsetX: "0px",
    offsetY: "2px",
    blur: "4px",
    spread: "0px",
  });
  expect(serializeValueCss("shadow", shadow.$value)).toBe("0px 2px 4px 0px var(--ref-color-black)");
});

test("serializeValueCss renders a border", () => {
  const border = tokens.border({ color: "#000000", width: "1px" });
  expect(serializeValueCss("border", border.$value)).toBe("1px solid #000000");
});

test("serializeValueCss renders a linear gradient", () => {
  const gradient = tokens.gradient({
    angle: "90deg",
    stops: [
      { color: "#000000", position: 0 },
      { color: "#ffffff", position: 1 },
    ],
  });
  expect(serializeValueCss("gradient", gradient.$value)).toBe(
    "linear-gradient(90deg, #000000 0%, #ffffff 100%)",
  );
});

test("serializeValueCss renders a radial gradient without emitting the angle", () => {
  const gradient = tokens.gradient({
    kind: "radial",
    stops: [
      { color: "#000000", position: 0 },
      { color: "#ffffff", position: 1 },
    ],
  });
  expect(serializeValueCss("gradient", gradient.$value)).toBe(
    "radial-gradient(#000000 0%, #ffffff 100%)",
  );
});

describe("serializeValueCss throws for expanded composite types", () => {
  test("typography", () => {
    const typography = tokens.typography({
      fontFamily: "Arial",
      fontSize: "16px",
      fontWeight: "regular",
    });
    expect(() => serializeValueCss("typography", typography.$value)).toThrow();
  });

  test("transition", () => {
    const transition = tokens.transition({ duration: "200ms", timingFunction: [0.4, 0, 0.2, 1] });
    expect(() => serializeValueCss("transition", transition.$value)).toThrow();
  });
});
