import { expect, test } from "@jest/globals";
import { defineConfig, defineReferenceTokens, tokens } from "../src/index.js";

function configWithRef(ref: Record<string, unknown>) {
  return () =>
    defineConfig({
      tokens: { ref: ref as never, system: {}, components: {} },
    });
}

test("a token name containing a dot throws", () => {
  expect(configWithRef({ spacing: { "0.5": tokens.dimension("2px") } })).toThrow(
    /cannot contain "."/,
  );
});

test("a group name containing braces throws", () => {
  expect(configWithRef({ "weird{name}": { black: tokens.color("#000000") } })).toThrow(
    /cannot contain/,
  );
});

test("a name starting with $ throws", () => {
  expect(configWithRef({ $type: { black: tokens.color("#000000") } })).toThrow(
    /cannot start with "\$"/,
  );
});

test("a scale key containing a dot throws", () => {
  const scale = tokens.dimensionScale({ "0.5": "2px" } as never);
  expect(configWithRef({ spacing: scale })).toThrow(/cannot contain "."/);
});

test("a valid tree with hyphenated scale keys does not throw", () => {
  const ref = defineReferenceTokens({
    spacing: tokens.dimensionScale({ "0-5": "2px", 1: "4px" }),
  });
  expect(() =>
    defineConfig({
      tokens: { ref, system: {}, components: {} },
    }),
  ).not.toThrow();
});

test('a token name "__proto__" throws instead of silently vanishing', () => {
  // Bracket/computed-key syntax creates a real own property named "__proto__";
  // `{ __proto__: ... }` literal syntax would instead set the object's prototype.
  const ref: Record<string, unknown> = {};
  Object.defineProperty(ref, "__proto__", {
    value: { black: tokens.color("#000000") },
    enumerable: true,
    configurable: true,
  });
  expect(configWithRef(ref)).toThrow(/"__proto__" is a reserved name/);
});

test('a token name "constructor" throws', () => {
  expect(configWithRef({ constructor: { black: tokens.color("#000000") } })).toThrow(
    /"constructor" is a reserved name/,
  );
});

test('a token name "prototype" throws', () => {
  expect(configWithRef({ prototype: { black: tokens.color("#000000") } })).toThrow(
    /"prototype" is a reserved name/,
  );
});

test("defineConfig surfaces a case-only name collision diagnostic", () => {
  const ref = defineReferenceTokens({
    color: { Blue: tokens.color("#0000ff"), blue: tokens.color("#0000fe") },
  });
  const config = defineConfig({
    tokens: { ref, system: {}, components: {} },
  });
  expect(config.diagnostics.some((d) => d.message.includes("differing only by case"))).toBe(true);
});
