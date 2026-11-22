import { expect, test } from "@jest/globals";
import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "../../src/index.js";
import { css } from "../../src/plugins/index.js";
import { runPlugins } from "../../src/plugins/runner.js";

function configWithRef(ref: Record<string, unknown>) {
  return () =>
    defineConfig({
      tokens: { ref: ref as never, system: {}, components: {} },
    });
}

test.each<[string, Record<string, unknown>, RegExp]>([
  [
    "a token name containing a dot",
    { spacing: { "0.5": tokens.dimension("2px") } },
    /cannot contain "."/,
  ],
  [
    "a group name containing braces",
    { "weird{name}": { black: tokens.color("#000000") } },
    /cannot contain/,
  ],
  [
    "a name starting with $",
    { $type: { black: tokens.color("#000000") } },
    /cannot start with "\$"/,
  ],
  [
    "a scale key containing a dot",
    { spacing: tokens.dimensionScale({ "0.5": "2px" } as never) },
    /cannot contain "."/,
  ],
  [
    "the reserved name constructor",
    { constructor: { black: tokens.color("#000000") } },
    /"constructor" is a reserved name/,
  ],
  [
    "the reserved name prototype",
    { prototype: { black: tokens.color("#000000") } },
    /"prototype" is a reserved name/,
  ],
  [
    // Bracket/computed-key syntax creates a real own property named "__proto__";
    // `{ __proto__: ... }` literal syntax would instead set the object's prototype.
    "the reserved name __proto__ (instead of silently vanishing)",
    Object.defineProperty({}, "__proto__", {
      value: { black: tokens.color("#000000") },
      enumerable: true,
      configurable: true,
    }),
    /"__proto__" is a reserved name/,
  ],
])("a ref tree with %s throws", (_name, ref, message) => {
  expect(configWithRef(ref)).toThrow(message);
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

test('a "__proto__" token name throws when it goes through defineReferenceTokens', () => {
  const input = { ["__proto__"]: { black: tokens.color("#000000") } };
  expect(configWithRef(defineReferenceTokens(input))).toThrow(/"__proto__" is a reserved name/);
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

test("group metadata reaches config.groups and survives stamping", () => {
  const ref = defineReferenceTokens({
    color: tokens
      .group({
        black: tokens.color("#000000"),
        nested: tokens.group({ white: tokens.color("#ffffff") }),
      })
      .describe("Base colors")
      .deprecate("Use system.color")
      .extend("com.example", { team: "design" }),
    plain: tokens.group({ a: tokens.color("#111111") }),
    untouched: { b: tokens.color("#222222") },
  });
  const config = defineConfig({
    tokens: { ref, system: {}, components: { button: tokens.group({}).describe("Buttons") } },
  });

  expect(Object.keys(ref.color)).toEqual(["black", "nested"]);
  expect([...config.groups.keys()]).toEqual(["ref.color", "button"]);
  expect(config.groups.get("ref.color")).toEqual({
    path: ["ref", "color"],
    layer: "ref",
    $description: "Base colors",
    $deprecated: "Use system.color",
    $extensions: { "com.example": { team: "design" } },
  });
  expect(config.groups.get("button")).toMatchObject({
    layer: "components",
    $description: "Buttons",
  });
  expect(config.registry.get("ref.color.black")!.scale).toBeUndefined();
});

test("a tokens.group inside a theme override is accepted", () => {
  const ref = defineReferenceTokens({
    color: { black: tokens.color("#000000"), white: tokens.color("#ffffff") },
  });
  const dark = defineTheme(ref, {
    color: tokens.group({ black: tokens.color("#222222") }).describe("Dark"),
  });
  expect([...dark.keys()]).toEqual(["ref.color.black"]);
});

test("describe on a stamped scale returns a stamped scale with the new metadata", () => {
  const ref = defineReferenceTokens({ spacing: tokens.dimensionScale({ 0: "0px" }) });
  const described = ref.spacing.describe("Later");
  expect(described.$description).toBe("Later");
  expect(ref.spacing.$description).toBeUndefined();
  expect(described._path).toEqual(["ref", "spacing"]);
  expect(Object.keys(described)).toEqual(["0"]);
});

test("defineConfig requires tokens or an introspection block", () => {
  expect(() => defineConfig({})).toThrow(/either tokens or an introspection block/);
  expect(() =>
    defineConfig({ introspection: { entry: "src/index.ts", importPath: "@acme/ds" } }),
  ).not.toThrow();
  // Tokens that define nothing do not count.
  expect(() => defineConfig({ tokens: {} })).toThrow(/either tokens or an introspection block/);
  expect(() =>
    defineConfig({ tokens: {}, introspection: { entry: "a.ts", importPath: "@acme/ds" } }),
  ).not.toThrow();
});

test("introspection is validated and passed through", () => {
  const config = defineConfig({
    introspection: {
      entry: "src/index.ts",
      tsconfig: "tsconfig.app.json",
      exclude: ["Internal"],
      importPath: "@acme/ds",
    },
  });
  expect(config.introspection).toEqual({
    entry: "src/index.ts",
    tsconfig: "tsconfig.app.json",
    exclude: ["Internal"],
    importPath: "@acme/ds",
  });
  expect(config.registry.size).toBe(0);

  expect(() => defineConfig({ introspection: { entry: "", importPath: "@acme/ds" } })).toThrow(
    /introspection\.entry/,
  );
  expect(() =>
    defineConfig({ introspection: { entry: "a.ts", tsconfig: "", importPath: "@acme/ds" } }),
  ).toThrow(/introspection\.tsconfig/);
  expect(() =>
    defineConfig({
      introspection: { entry: "a.ts", exclude: "Button" as never, importPath: "@acme/ds" },
    }),
  ).toThrow(/introspection\.exclude/);
  expect(() =>
    defineConfig({
      introspection: { entry: "a.ts", exclude: [1 as never], importPath: "@acme/ds" },
    }),
  ).toThrow(/introspection\.exclude/);
  expect(() => defineConfig({ introspection: { entry: "a.ts" } as never })).toThrow(
    /introspection\.importPath/,
  );
  expect(() =>
    defineConfig({ introspection: { entry: "a.ts", importPath: { root: 1 } as never } }),
  ).toThrow(/introspection\.importPath/);
});

test("dependsOn is optional but must be valid when given", () => {
  const tokensOnly = { name: "acme:a", dependsOn: ["tokens"] as ("tokens" | "components")[] };
  const config = (plugin: unknown) =>
    defineConfig({
      introspection: { entry: "a.ts", importPath: "@acme/ds" },
      plugins: plugin as never,
    });

  expect(() => config(tokensOnly)).not.toThrow();
  expect(() => config({ name: "acme:a" })).not.toThrow();
  expect(() => config({ name: "acme:a", dependsOn: "tokens" as never })).toThrow(
    /"acme:a": `dependsOn` must be an array/,
  );
  expect(() => config({ name: "acme:a", dependsOn: ["tokenz"] })).toThrow(
    /`dependsOn` must be an array/,
  );
});

test("scale members keep chainable methods and plain layer objects preserve stamped aliases/scales", () => {
  const ref = defineReferenceTokens({
    color: { blue: tokens.colorScale({ 500: "#2563eb" }) },
    fontSize: tokens.dimensionScale({ sm: "12px" }),
    lineHeight: tokens.numberScale({ sm: 1.5 }),
  });
  const faded = ref.color.blue[500].alpha(0.5);
  expect(faded.$value.alpha).toBe(0.5);

  const config = defineConfig({
    tokens: {
      ref,
      system: {
        accent: ref.color.blue[500],
        palette: ref.color.blue,
      },
    },
  });
  expect(config.diagnostics).toEqual([]);
  expect(config.registry.get("system.accent")?.alias).toEqual(["ref", "color", "blue", "500"]);
  expect(config.registry.has("system.palette.500")).toBe(true);
});

test("plugins may be given as a single plugin or as a list", () => {
  const a = { name: "acme:a", dependsOn: ["tokens" as const] };
  const b = { name: "acme:b", dependsOn: ["tokens" as const] };

  expect(
    defineConfig({ introspection: { entry: "a.ts", importPath: "@acme/ds" }, plugins: a }).plugins,
  ).toEqual([a]);
  expect(
    defineConfig({ introspection: { entry: "a.ts", importPath: "@acme/ds" }, plugins: [a, b] })
      .plugins,
  ).toEqual([a, b]);
});

test("a config with only the system layer registers just those entries, without diagnostics", () => {
  const system = defineSystemTokens({ color: { background: tokens.color("#ffffff") } });
  const config = defineConfig({ tokens: { system } });
  expect([...config.registry.keys()]).toEqual(["system.color.background"]);
  expect(config.diagnostics).toEqual([]);
});

test("a Windows-style outDir is normalized to forward slashes", async () => {
  const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
  const config = defineConfig({ tokens: { ref }, plugins: css({ outDir: "out\\tokens" }) });
  const result = await runPlugins(config, {
    root: "/project",
    logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
  });
  expect(result.files.map((file) => file.path)).toEqual(["out/tokens/tokens.css"]);
});

test.each([
  ["components", "introspection"],
  ["components?", "introspection?"],
])('dependsOn "%s" throws a rename error pointing at "%s"', (old, renamed) => {
  const plugin = { name: "acme:old", dependsOn: ["tokens", old] } as never;
  expect(() => defineConfig({ tokens: { ref: {} }, plugins: plugin })).toThrow(
    `Plugin "acme:old": dependsOn "${old}" was renamed to "${renamed}".`,
  );
});

test.each(['x" { } .evil {', "a/b", "../up", "1st", "-dark", "dark mode", ""])(
  "defineConfig rejects the theme name %j",
  (name) => {
    expect(() =>
      defineConfig({
        introspection: { entry: "a.ts", importPath: "@acme/ds" },
        themes: { [name]: new Map() },
      }),
    ).toThrow(/Invalid theme name/);
  },
);

test("defineConfig accepts hyphenated and underscored theme names", () => {
  expect(() =>
    defineConfig({
      introspection: { entry: "a.ts", importPath: "@acme/ds" },
      themes: { "dark-mode": new Map(), high_contrast: new Map() },
    }),
  ).not.toThrow();
});

test.each(["ref", "system"])("a top-level %s group in the components layer throws", (name) => {
  expect(() =>
    defineConfig({
      tokens: { components: { [name]: { x: tokens.color("#000000") } } as never },
    }),
  ).toThrow(new RegExp(`"${name}" would overwrite`));
});

test("defineTheme records aliases for stamped tokens and literals for raw ones", () => {
  const ref = defineReferenceTokens({
    gray: tokens.colorScale({ 100: "#f0f0f0", 900: "#101010" }),
    brand: tokens.colorScale({ 100: "#e0e0ff", 900: "#000066" }),
  });

  const dark = defineTheme(ref, {
    gray: tokens.colorScale({ 100: ref.brand[900], 900: tokens.color("#222222") }),
  });

  expect([...dark.keys()].sort()).toEqual(["ref.gray.100", "ref.gray.900"]);
  expect(dark.get("ref.gray.100")).toEqual({
    $value: ref.brand[900].$value,
    alias: ["ref", "brand", "900"],
  });
  expect(dark.get("ref.gray.900")).toEqual({ $value: tokens.color("#222222").$value });
});

test("defineTheme overrides several layers at once, each key mapping to its own layer's path", () => {
  const ref = defineReferenceTokens({
    neutral: tokens.colorScale({ 0: "#ffffff", 900: "#101010" }),
  });
  const system = defineSystemTokens({ colors: { background: ref.neutral[0] } });

  const dark = defineTheme(
    { ref, system },
    {
      ref: { neutral: tokens.colorScale({ 0: "#fafafa", 900: "#0a0a0a" }) },
      system: { colors: { background: ref.neutral[900] } },
    },
  );

  expect([...dark.keys()].sort()).toEqual([
    "ref.neutral.0",
    "ref.neutral.900",
    "system.colors.background",
  ]);
  expect(dark.get("system.colors.background")?.alias).toEqual(["ref", "neutral", "900"]);
});

test("defineTheme extends other themes in order; later overrides win", () => {
  const ref = defineReferenceTokens({
    a: tokens.color("#000001"),
    b: tokens.color("#000002"),
    c: tokens.color("#000003"),
  });
  const first = defineTheme(ref, { a: tokens.color("#111111"), b: tokens.color("#111111") });
  const second = defineTheme(ref, { b: tokens.color("#222222"), c: tokens.color("#222222") });

  const combined = defineTheme(ref, { c: ref.a }, { extends: [first, second] });

  expect(combined.get("ref.a")).toEqual(first.get("ref.a"));
  expect(combined.get("ref.b")).toEqual(second.get("ref.b"));
  expect(combined.get("ref.c")).toEqual({ $value: ref.a.$value, alias: ["ref", "a"] });
  expect(first.has("ref.c")).toBe(false);
});
