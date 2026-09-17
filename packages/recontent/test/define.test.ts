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

test("defineConfig surfaces a case-only name collision diagnostic", () => {
  const ref = defineReferenceTokens({
    color: { Blue: tokens.color("#0000ff"), blue: tokens.color("#0000fe") },
  });
  const config = defineConfig({
    tokens: { ref, system: {}, components: {} },
  });
  expect(config.diagnostics.some((d) => d.message.includes("differing only by case"))).toBe(true);
});
