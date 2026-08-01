import assert from "node:assert/strict";
import test from "node:test";
import { defineReferenceTokens, tokens } from "../dist/index.mjs";
import {
  entryToDtcgNode,
  serializeValueCss,
  serializeValueDtcg,
} from "../dist/core/generators/serialize.mjs";

test("serializeValueDtcg emits the 2025.10 dimension shape", () => {
  assert.deepEqual(serializeValueDtcg("dimension", tokens.dimension("16px").$value), {
    value: 16,
    unit: "px",
  });
});

test("serializeValueDtcg emits the 2025.10 duration shape", () => {
  assert.deepEqual(serializeValueDtcg("duration", tokens.duration("200ms").$value), {
    value: 200,
    unit: "ms",
  });
});

test("serializeValueDtcg emits the full color object", () => {
  const value = tokens.color("#000000").$value;
  assert.deepEqual(serializeValueDtcg("color", value), value);
});

test("serializeValueDtcg emits a strokeStyle keyword", () => {
  assert.equal(serializeValueDtcg("strokeStyle", tokens.strokeStyle("dashed").$value), "dashed");
});

test("serializeValueDtcg emits a border composite node with a member reference", () => {
  const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
  const border = tokens.border({ color: ref.color.black, width: "1px" });
  const node = serializeValueDtcg("border", border.$value);
  assert.equal(node.color, "{ref.color.black}");
  assert.deepEqual(node.width, { value: 1, unit: "px" });
  assert.equal(node.style, "solid");
});

test("serializeValueDtcg emits a single shadow layer as a bare object", () => {
  const shadow = tokens.shadow({
    color: "#000000",
    offsetX: "0px",
    offsetY: "2px",
    blur: "4px",
    spread: "0px",
  });
  const node = serializeValueDtcg("shadow", shadow.$value);
  assert.ok(!Array.isArray(node));
  assert.deepEqual(node.offsetY, { value: 2, unit: "px" });
});

test("serializeValueDtcg emits multiple shadow layers as an array", () => {
  const shadow = tokens.shadow([
    { color: "#000000", offsetX: "0px", offsetY: "1px", blur: "2px", spread: "0px" },
    { color: "#111111", offsetX: "0px", offsetY: "4px", blur: "8px", spread: "0px" },
  ]);
  const node = serializeValueDtcg("shadow", shadow.$value);
  assert.equal(node.length, 2);
});

test("serializeValueDtcg emits a gradient as a bare stop array", () => {
  const gradient = tokens.gradient({
    stops: [
      { color: "#000000", position: 0 },
      { color: "#ffffff", position: 1 },
    ],
  });
  const node = serializeValueDtcg("gradient", gradient.$value);
  assert.equal(node.length, 2);
  assert.equal(node[0].position, 0);
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
  assert.deepEqual(node.$extensions, { "com.recontent": { kind: "radial", angle: "180deg" } });
});

test("entryToDtcgNode records inset layers under $extensions", () => {
  const shadow = tokens.shadow([
    { color: "#000000", offsetX: "0px", offsetY: "1px", blur: "2px", spread: "0px", inset: true },
  ]);
  const node = entryToDtcgNode({
    path: ["system", "shadow", "inner"],
    $type: "shadow",
    $value: shadow.$value,
    layer: "system",
  });
  assert.deepEqual(node.$extensions, { "com.recontent": { inset: [true] } });
});

test("entryToDtcgNode omits $extensions for shadows without inset layers", () => {
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
  assert.equal(node.$extensions, undefined);
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
  assert.equal(
    serializeValueCss("shadow", shadow.$value),
    "0px 2px 4px 0px var(--ref-color-black)",
  );
});

test("serializeValueCss renders a border", () => {
  const border = tokens.border({ color: "#000000", width: "1px" });
  assert.equal(serializeValueCss("border", border.$value), "1px solid #000000");
});

test("serializeValueCss renders a linear gradient", () => {
  const gradient = tokens.gradient({
    angle: "90deg",
    stops: [
      { color: "#000000", position: 0 },
      { color: "#ffffff", position: 1 },
    ],
  });
  assert.equal(
    serializeValueCss("gradient", gradient.$value),
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
  assert.equal(
    serializeValueCss("gradient", gradient.$value),
    "radial-gradient(#000000 0%, #ffffff 100%)",
  );
});

test("serializeValueCss throws for expanded composite types", () => {
  const typography = tokens.typography({
    fontFamily: "Arial",
    fontSize: "16px",
    fontWeight: "regular",
  });
  assert.throws(() => serializeValueCss("typography", typography.$value));

  const transition = tokens.transition({ duration: "200ms", timingFunction: [0.4, 0, 0.2, 1] });
  assert.throws(() => serializeValueCss("transition", transition.$value));
});
