import { expect, test } from "@jest/globals";
import { defineConfig, defineReferenceTokens, defineSystemTokens, tokens } from "../src/index.js";

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

test('a "__proto__" token name throws when it goes through defineReferenceTokens', () => {
  const input = { ["__proto__"]: { black: tokens.color("#000000") } };
  expect(configWithRef(defineReferenceTokens(input))).toThrow(/"__proto__" is a reserved name/);
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

test("scale describe/deprecate/extend return new scales without changing members", () => {
  const scale = tokens.dimensionScale({ 0: "0px", 1: "4px" });
  const described = scale.describe("Spacing");
  const deprecated = described.deprecate("Use something else");
  const extended = deprecated.extend("com.example", { a: 1 });

  expect(described).not.toBe(scale);
  expect(scale.$description).toBeUndefined();
  expect(described.$description).toBe("Spacing");
  expect(described.$deprecated).toBeUndefined();
  expect(deprecated.$description).toBe("Spacing");
  expect(deprecated.$deprecated).toBe("Use something else");
  expect(extended.$extensions).toEqual({ "com.example": { a: 1 } });
  expect(Object.keys(extended)).toEqual(["0", "1"]);
  expect(extended.$type).toBe("dimension");
  expect(extended[1].$value).toEqual({ value: 4, unit: "px" });
  expect(tokens.dimensionScale({ 0: "0px" }).deprecate().$deprecated).toBe(true);
});

test("scale metadata reaches the registry and survives stamping and aliasing", () => {
  const ref = defineReferenceTokens({
    spacing: tokens
      .dimensionScale({ 0: "0px", 1: "4px" })
      .describe("Spacing scale")
      .deprecate("Use system.spacing"),
    plain: tokens.dimensionScale({ a: "1px" }),
  });
  const system = defineSystemTokens({ spacing: ref.spacing });
  const config = defineConfig({ tokens: { ref, system, components: {} } });

  expect(Object.keys(ref.spacing)).toEqual(["0", "1"]);
  const refEntry = config.registry.get("ref.spacing.0")!;
  expect(refEntry.scale?.$description).toBe("Spacing scale");
  expect(refEntry.scale?.$deprecated).toBe("Use system.spacing");
  expect(refEntry.$deprecated).toBeUndefined();
  expect(config.registry.get("ref.plain.a")!.scale?.$description).toBeUndefined();

  const systemEntry = config.registry.get("system.spacing.0")!;
  expect(systemEntry.scale?.$description).toBe("Spacing scale");
  expect(systemEntry.scale?.$deprecated).toBe("Use system.spacing");
});

test("describe on a stamped scale returns a stamped scale with the new metadata", () => {
  const ref = defineReferenceTokens({ spacing: tokens.dimensionScale({ 0: "0px" }) });
  const described = ref.spacing.describe("Later");
  expect(described.$description).toBe("Later");
  expect(ref.spacing.$description).toBeUndefined();
  expect(described._path).toEqual(["ref", "spacing"]);
  expect(Object.keys(described)).toEqual(["0"]);
});
