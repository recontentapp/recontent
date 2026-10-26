import { describe, expect, test } from "@jest/globals";
import { needsComponents, runPlugins, sortPlugins } from "../../src/plugins/runner.js";
import type { Config, PluginContext, RecontentPlugin } from "@recontentapp/core";

test("sortPlugins stably partitions pre / unenforced / post", () => {
  const plugin = (name: string, enforce?: "pre" | "post"): RecontentPlugin => ({
    name,
    enforce,
    dependsOn: ["tokens"],
  });
  const plugins = [
    plugin("normal-a"),
    plugin("post-a", "post"),
    plugin("pre-a", "pre"),
    plugin("normal-b"),
    plugin("pre-b", "pre"),
    plugin("post-b", "post"),
  ];
  expect(sortPlugins(plugins).map((p) => p.name)).toEqual([
    "pre-a",
    "pre-b",
    "normal-a",
    "normal-b",
    "post-a",
    "post-b",
  ]);
});

function baseConfig(plugins: RecontentPlugin[]): Config {
  return {
    registry: new Map(),
    diagnostics: [],
    themes: {},
    plugins,
    logLevel: "info",
  };
}

const runOptions = {
  root: "/project",
  mode: "build" as const,
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

test("two plugins emitting the same file path throws, naming both plugins", async () => {
  const a: RecontentPlugin = {
    name: "a",
    dependsOn: ["tokens"],
    generate: () => [{ path: "out.txt", content: "a" }],
  };
  const b: RecontentPlugin = {
    name: "b",
    dependsOn: ["tokens"],
    generate: () => [{ path: "out.txt", content: "b" }],
  };
  await expect(runPlugins(baseConfig([a, b]), runOptions)).rejects.toThrow(
    /File path collision at "out.txt": both plugin "a" and plugin "b"/,
  );
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
  expect(result.diagnostics).toEqual([{ severity: "error", message: "bad" }]);
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
  expect(result.diagnostics).toEqual([{ severity: "warning", message: "heads up" }]);
});

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
    { name: "Button", sourceFilePath: "b.tsx", line: 1, props: [], inherits: [] },
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
      baseConfig([record("tokens-only", ["tokens"]), record("both", ["tokens", "components"])]),
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
      baseConfig([record("tokens-only", ["tokens"]), record("docs", ["tokens", "components"])]),
      { ...runOptions, componentsError: "Could not find React's types" },
    );

    expect(result.failures).toEqual(["[docs] Could not find React's types"]);
    expect(result.files).toEqual([{ path: "tokens-only.txt", content: "tokens-only" }]);
    expect(result.diagnostics).toEqual([]);
  });

  test("needsComponents is true when any plugin depends on components", () => {
    const config = (introspection?: Config["introspection"]): Config => ({
      ...baseConfig([record("tokens-only", ["tokens"]), record("api", ["components"])]),
      introspection,
    });

    expect(needsComponents(baseConfig([record("tokens-only", ["tokens"])]))).toBe(false);
    expect(needsComponents(config({ entry: "src/index.ts" }))).toBe(true);
  });

  test("a plugin depending on components without an introspection block is a config error", () => {
    expect(() =>
      needsComponents(baseConfig([record("recontent:docs", ["tokens", "components"])])),
    ).toThrow("`recontent:docs` depends on components; add `introspection` to defineConfig().");
  });
});
