import assert from "node:assert/strict";
import test from "node:test";
import { defineReferenceTokens, tokens } from "../dist/index.mjs";

test("tokens.strokeStyle accepts a keyword", () => {
  const token = tokens.strokeStyle("dashed");
  assert.equal(token.$type, "strokeStyle");
  assert.deepEqual(token.$value, { style: "dashed" });
});

test("tokens.strokeStyle rejects an unknown keyword", () => {
  assert.throws(() => tokens.strokeStyle("squiggly"));
});

test("tokens.strokeStyle accepts a custom dash", () => {
  const token = tokens.strokeStyle({ dashArray: ["4px", "2px"], lineCap: "round" });
  assert.deepEqual(token.$value, {
    dashArray: [
      { value: 4, unit: "px" },
      { value: 2, unit: "px" },
    ],
    lineCap: "round",
  });
});

test("tokens.strokeStyle rejects an invalid lineCap", () => {
  assert.throws(() => tokens.strokeStyle({ dashArray: ["4px"], lineCap: "bevel" }));
});

test("tokens.shadow builds a single layer from raw input", () => {
  const token = tokens.shadow({
    color: "#000000",
    offsetX: "0px",
    offsetY: "2px",
    blur: "4px",
    spread: "0px",
  });
  assert.equal(token.$type, "shadow");
  assert.equal(token.$value.layers.length, 1);
  assert.equal(token.$value.layers[0].color.alias, undefined);
  assert.deepEqual(token.$value.layers[0].offsetY.$value, { value: 2, unit: "px" });
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
  assert.equal(token.$value.layers.length, 2);
  assert.deepEqual(token.$value.layers[0].color.alias, ["ref", "color", "black"]);
  assert.equal(token.$value.layers[0].inset, true);
  assert.equal(token.$value.layers[1].inset, undefined);
});

test("tokens.shadow requires all layer members", () => {
  assert.throws(() =>
    tokens.shadow({ color: "#000000", offsetX: "0px", offsetY: "0px", blur: "0px" }),
  );
});

test("tokens.border defaults style to solid", () => {
  const token = tokens.border({ color: "#000000", width: "1px" });
  assert.deepEqual(token.$value.style.$value, { style: "solid" });
});

test("tokens.border requires color and width", () => {
  assert.throws(() => tokens.border({ width: "1px" }));
});

test("tokens.transition defaults delay to 0ms", () => {
  const token = tokens.transition({ duration: "200ms", timingFunction: [0.4, 0, 0.2, 1] });
  assert.deepEqual(token.$value.delay.$value, { value: 0, unit: "ms" });
});

test("tokens.transition requires duration and timingFunction", () => {
  assert.throws(() => tokens.transition({ duration: "200ms" }));
});

test("tokens.gradient requires at least 2 stops", () => {
  assert.throws(() => tokens.gradient({ stops: [{ color: "#000000", position: 0 }] }));
});

test("tokens.gradient validates stop positions", () => {
  assert.throws(() =>
    tokens.gradient({
      stops: [
        { color: "#000000", position: -0.1 },
        { color: "#ffffff", position: 1 },
      ],
    }),
  );
});

test("tokens.gradient defaults kind and angle", () => {
  const token = tokens.gradient({
    stops: [
      { color: "#000000", position: 0 },
      { color: "#ffffff", position: 1 },
    ],
  });
  assert.equal(token.$value.kind, "linear");
  assert.equal(token.$value.angle, "180deg");
});

test("tokens.typography requires fontFamily, fontSize, and fontWeight", () => {
  assert.throws(() => tokens.typography({ fontFamily: "Arial", fontSize: "16px" }));
});

test("tokens.typography defaults letterSpacing and lineHeight", () => {
  const token = tokens.typography({ fontFamily: "Arial", fontSize: "16px", fontWeight: "regular" });
  assert.deepEqual(token.$value.letterSpacing.$value, { value: 0, unit: "px" });
  assert.equal(token.$value.lineHeight.$value.value, 1.4);
});

test("tokens.typography accepts a stamped token and records its alias", () => {
  const ref = defineReferenceTokens({ fontFamily: { body: tokens.fontFamily("Arial") } });
  const token = tokens.typography({
    fontFamily: ref.fontFamily.body,
    fontSize: "16px",
    fontWeight: "regular",
  });
  assert.deepEqual(token.$value.fontFamily.alias, ["ref", "fontFamily", "body"]);
});
