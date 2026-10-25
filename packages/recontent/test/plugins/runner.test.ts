import { expect, test } from "@jest/globals";
import { runPlugins, sortPlugins } from "../../src/plugins/runner.js";
import type { Config, PluginContext, RecontentPlugin } from "@recontentapp/core";

test("sortPlugins stably partitions pre / unenforced / post", () => {
  const plugin = (name: string, enforce?: "pre" | "post"): RecontentPlugin => ({ name, enforce });
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
  const a: RecontentPlugin = { name: "a", generate: () => [{ path: "out.txt", content: "a" }] };
  const b: RecontentPlugin = { name: "b", generate: () => [{ path: "out.txt", content: "b" }] };
  await expect(runPlugins(baseConfig([a, b]), runOptions)).rejects.toThrow(
    /File path collision at "out.txt": both plugin "a" and plugin "b"/,
  );
});

test("an error-severity validate diagnostic short-circuits before any generate runs", async () => {
  let generated = false;
  const a: RecontentPlugin = {
    name: "a",
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
    validate: () => [{ severity: "warning", message: "heads up" }],
    generate: () => [{ path: "a.txt", content: "a" }],
  };
  const result = await runPlugins(baseConfig([a]), runOptions);
  expect(result.files).toEqual([{ path: "a.txt", content: "a" }]);
  expect(result.diagnostics).toEqual([{ severity: "warning", message: "heads up" }]);
});

test("buildEnd receives the full file list from every plugin", async () => {
  let seen: string[] = [];
  const a: RecontentPlugin = { name: "a", generate: () => [{ path: "a.txt", content: "a" }] };
  const b: RecontentPlugin = {
    name: "b",
    generate: () => [{ path: "b.txt", content: "b" }],
    buildEnd: (ctx) => {
      seen = ctx.files.map((f) => f.path);
    },
  };
  await runPlugins(baseConfig([a, b]), runOptions);
  expect(seen.sort()).toEqual(["a.txt", "b.txt"]);
});

test("plugins see ctx.components and ctx.git when provided, and neither otherwise", async () => {
  const seen: Array<Pick<PluginContext, "components" | "git">> = [];
  const plugin: RecontentPlugin = {
    name: "a",
    buildStart: (ctx) => {
      seen.push({ components: ctx.components, git: ctx.git });
    },
  };
  const components = { schemaVersion: "1" as const, components: [], warnings: [] };
  const git = { commit: "abc1234", dirty: false, shallow: false, root: "" };

  await runPlugins(baseConfig([plugin]), { ...runOptions, components, git });
  await runPlugins(baseConfig([plugin]), runOptions);

  expect(seen).toEqual([
    { components, git },
    { components: undefined, git: undefined },
  ]);
});
