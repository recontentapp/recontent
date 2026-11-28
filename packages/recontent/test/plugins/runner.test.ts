import { describe, expect, test } from "@jest/globals";
import { defineConfig, defineReferenceTokens, tokens } from "../../src/index.js";
import { stylex, typescript, typescriptNative, vanillaExtract } from "../../src/plugins/index.js";
import { needsIntrospection, runPlugins } from "../../src/plugins/runner.js";
import { generateStylexFiles } from "../../src/plugins/stylex.js";
import { generateTypeScriptFiles } from "../../src/plugins/typescript.js";
import { generateTypeScriptNativeFiles } from "../../src/plugins/typescript-native.js";
import { generateVanillaExtractFiles } from "../../src/plugins/vanilla-extract/generate.js";
import type { Config } from "../../src/config/types.js";
import type { PluginContext, RecontentPlugin } from "../../src/plugins/types.js";
import { themedConfig } from "../helpers/fixtures.js";

function baseConfig(plugins: RecontentPlugin[]): Config {
  return {
    registry: new Map(),
    groups: new Map(),
    diagnostics: [],
    themes: [],
    plugins,
    logLevel: "info",
  };
}

const runOptions = {
  root: "/project",
  logger: {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  },
};

test("enforce ordering: pre before unenforced before post, stable within each group", () => {
  const order: string[] = [];
  const plugin = (name: string, enforce?: "pre" | "post"): RecontentPlugin => ({
    name,
    enforce,
    dependsOn: ["tokens"],
    generate: () => {
      order.push(name);
      return [];
    },
  });
  const plugins = [
    plugin("normal-a"),
    plugin("post-a", "post"),
    plugin("pre-a", "pre"),
    plugin("normal-b"),
    plugin("pre-b", "pre"),
    plugin("post-b", "post"),
  ];
  return runPlugins(baseConfig(plugins), runOptions).then(() => {
    expect(order).toEqual(["pre-a", "pre-b", "normal-a", "normal-b", "post-a", "post-b"]);
  });
});

test.each([
  ["two plugins", ["a", "b"], ["out.txt", "out.txt"], /"out.txt": both plugin "a" and plugin "b"/],
  [
    "two instances of the same plugin",
    ["recontent:css", "recontent:css"],
    ["out/tokens.css", "out/tokens.css"],
    /"out\/tokens.css": both plugin "recontent:css" and plugin "recontent:css"/,
  ],
  [
    "an absolute path inside the root and its relative twin",
    ["a", "b"],
    ["a.css", "/project/a.css"],
    /File path collision/,
  ],
])("%s emitting the same file path throws", async (_name, names, paths, message) => {
  const plugins = names.map((name, index): RecontentPlugin => ({
    name,
    dependsOn: ["tokens"],
    generate: () => [{ path: paths[index]!, content: String(index) }],
  }));
  await expect(runPlugins(baseConfig(plugins), runOptions)).rejects.toThrow(message);
});

test("a plugin emitting the same file path twice throws", async () => {
  const a: RecontentPlugin = {
    name: "a",
    dependsOn: ["tokens"],
    generate: () => [
      { path: "out.txt", content: "1" },
      { path: "./out.txt", content: "2" },
    ],
  };
  await expect(runPlugins(baseConfig([a]), runOptions)).rejects.toThrow(
    /File path collision at "out.txt": plugin "a" emitted this file twice/,
  );
});

test("paths that differ only by case collide", async () => {
  const a: RecontentPlugin = {
    name: "a",
    dependsOn: ["tokens"],
    generate: () => [
      { path: "out/Tokens.css", content: "1" },
      { path: "out/tokens.css", content: "2" },
    ],
  };
  await expect(runPlugins(baseConfig([a]), runOptions)).rejects.toThrow(/File path collision/);
});

test("an error-severity validate diagnostic short-circuits before any generate runs", async () => {
  let generated = false;
  const a: RecontentPlugin = {
    name: "a",
    dependsOn: ["tokens"],
    validate: () => [{ severity: "error", message: "bad" }],
    generate: () => {
      generated = true;
      return [{ path: "a.txt", content: "a" }];
    },
  };
  const result = await runPlugins(baseConfig([a]), runOptions);
  expect(result.files).toEqual([]);
  expect(result.diagnostics).toEqual([{ plugin: "a", severity: "error", message: "bad" }]);
  expect(generated).toBe(false);
});

test("a warning-severity validate diagnostic does not short-circuit generate", async () => {
  const a: RecontentPlugin = {
    name: "a",
    dependsOn: ["tokens"],
    validate: () => [{ severity: "warning", message: "heads up" }],
    generate: () => [{ path: "a.txt", content: "a" }],
  };
  const result = await runPlugins(baseConfig([a]), runOptions);
  expect(result.files).toEqual([{ path: "a.txt", content: "a" }]);
  expect(result.diagnostics).toEqual([{ plugin: "a", severity: "warning", message: "heads up" }]);
});

test.each(["buildStart", "validate", "generate", "buildEnd"] as const)(
  "an error thrown from %s names the plugin and keeps the original as the cause",
  async (hook) => {
    const original = new Error("boom");
    const plugin: RecontentPlugin = {
      name: "acme:broken",
      dependsOn: ["tokens"],
      [hook]: () => {
        throw original;
      },
    };

    const error = await runPlugins(baseConfig([plugin]), runOptions).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe(`[acme:broken] ${hook} failed: boom`);
    expect((error as Error).cause).toBe(original);
  },
);

test("buildEnd receives the full file list from every plugin", async () => {
  let seen: string[] = [];
  const a: RecontentPlugin = {
    name: "a",
    dependsOn: ["tokens"],
    generate: () => [{ path: "a.txt", content: "a" }],
  };
  const b: RecontentPlugin = {
    name: "b",
    dependsOn: ["tokens"],
    generate: () => [{ path: "b.txt", content: "b" }],
    buildEnd: (ctx) => {
      seen = ctx.files.map((f) => f.path);
    },
  };
  await runPlugins(baseConfig([a, b]), runOptions);
  expect(seen.sort()).toEqual(["a.txt", "b.txt"]);
});

describe("dependsOn", () => {
  const components = [
    { name: "Button", sourceFilePath: "b.tsx", line: 1, props: [], inherits: [], references: [] },
  ];
  const seen: Record<string, PluginContext["components"]> = {};
  const record = (name: string, dependsOn: RecontentPlugin["dependsOn"]): RecontentPlugin => ({
    name,
    dependsOn,
    buildStart: (ctx) => {
      seen[name] = ctx.components;
    },
    generate: () => [{ path: `${name}.txt`, content: name }],
  });

  test("only plugins that depend on components see them", async () => {
    await runPlugins(
      baseConfig([record("tokens-only", ["tokens"]), record("both", ["tokens", "introspection"])]),
      {
        ...runOptions,
        components,
      },
    );

    expect(seen["tokens-only"]).toBeUndefined();
    expect(seen["both"]).toBe(components);
  });

  test("a components failure fails the plugins that depend on it; the others still generate", async () => {
    const result = await runPlugins(
      baseConfig([record("tokens-only", ["tokens"]), record("docs", ["tokens", "introspection"])]),
      { ...runOptions, introspectionError: "Could not find React's types" },
    );

    expect(result.failures).toEqual(["[docs] Could not find React's types"]);
    expect(result.files).toEqual([{ path: "tokens-only.txt", content: "tokens-only" }]);
    expect(result.diagnostics).toEqual([]);
  });

  test("needsIntrospection is true when any plugin depends on components", () => {
    const config = (introspection?: Config["introspection"]): Config => ({
      ...baseConfig([record("tokens-only", ["tokens"]), record("api", ["introspection"])]),
      introspection,
    });

    expect(needsIntrospection(baseConfig([record("tokens-only", ["tokens"])]))).toBe(false);
    expect(needsIntrospection(config({ entry: "src/index.ts", importPath: "@acme/ds" }))).toBe(
      true,
    );
  });

  test("a plugin whose components are optional runs without introspection, and gets them with it", async () => {
    const optional = record("docs", ["tokens", "introspection?"]);

    expect(needsIntrospection(baseConfig([optional]))).toBe(false);
    expect(
      needsIntrospection({
        ...baseConfig([optional]),
        introspection: { entry: "src/index.ts", importPath: "@acme/ds" },
      }),
    ).toBe(true);

    await runPlugins(baseConfig([optional]), runOptions);
    expect(seen["docs"]).toBeUndefined();
    await runPlugins(baseConfig([optional]), { ...runOptions, components });
    expect(seen["docs"]).toBe(components);
  });

  test("a plugin depending on components without an introspection block is a config error", () => {
    expect(() =>
      needsIntrospection(baseConfig([record("recontent:docs", ["tokens", "introspection"])])),
    ).toThrow("`recontent:docs` depends on introspection; add `introspection` to defineConfig().");
  });
});

test.each([
  ["typescript", (outDir: string) => typescript({ outDir })],
  ["typescript-native", (outDir: string) => typescriptNative({ outDir })],
  ["stylex", (outDir: string) => stylex({ outDir })],
  ["vanilla-extract", (outDir: string) => vanillaExtract({ outDir })],
])("a hyphenated theme name is a %s validate error, not a generate failure", async (_, plugin) => {
  const config = defineConfig({
    tokens: { ref: defineReferenceTokens({ black: tokens.color("#000000") }) },
    themes: { "dark-hc": new Map() },
    plugins: plugin("out"),
  });
  const result = await runPlugins(config, runOptions);

  expect(result.failures).toEqual([]);
  expect(result.files).toEqual([]);
  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      severity: "error",
      message: expect.stringContaining('Theme name "dark-hc"'),
    }),
  ]);
});

test.each([
  ["typescript", (config: Config) => generateTypeScriptFiles(config, { outDir: "out" })],
  [
    "typescript-native",
    (config: Config) => generateTypeScriptNativeFiles(config, { outDir: "out" }),
  ],
  ["stylex", (config: Config) => generateStylexFiles(config)],
  ["vanilla-extract", (config: Config) => generateVanillaExtractFiles(config)],
])("the %s generator throws on a theme name that is not an identifier", (target, generate) => {
  const { config } = themedConfig({ layer: "ref", name: "dark-mode" });

  expect(() => generate(config)).toThrow(
    `Theme name "dark-mode" cannot be used with the "${target}" output target`,
  );
});
