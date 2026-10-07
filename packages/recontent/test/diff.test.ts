import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { Config, ThemeOverride, TokenEntry, TokenRegistry } from "@recontentapp/core";
import { diffConfigs, formatDiff, hasBreakingChanges } from "../src/cli/diff/diff.js";
import { findExternalImports } from "../src/cli/config-graph.js";
import { runDiff } from "../src/cli/commands/diff.js";

function entry(path: string[], overrides: Partial<TokenEntry> = {}): TokenEntry {
  return {
    path,
    $type: "color",
    $value: { colorSpace: "srgb", components: [0, 0, 0], alpha: 1, hex: "#000000" },
    layer: "ref",
    ...overrides,
  };
}

function color(hex: string) {
  return {
    colorSpace: "srgb" as const,
    components: [0, 0, 0] as [number, number, number],
    alpha: 1,
    hex,
  };
}

function config(registry: TokenRegistry, themes: Record<string, ThemeOverride> = {}): Config {
  return {
    registry,
    diagnostics: [],
    themes,
    plugins: [],
    logLevel: "info",
  };
}

test("diffConfigs reports a straight add", () => {
  const base = config(new Map());
  const head = config(new Map([["ref.color.blue", entry(["ref", "color", "blue"])]]));
  const diff = diffConfigs(base, head);
  expect(diff.added).toHaveLength(1);
  expect(diff.removed).toHaveLength(0);
  expect(diff.renamed).toHaveLength(0);
  expect(hasBreakingChanges(diff)).toBe(false);
});

test("diffConfigs reports a straight remove", () => {
  const base = config(new Map([["ref.color.blue", entry(["ref", "color", "blue"])]]));
  const head = config(new Map());
  const diff = diffConfigs(base, head);
  expect(diff.removed).toHaveLength(1);
  expect(diff.added).toHaveLength(0);
  expect(hasBreakingChanges(diff)).toBe(true);
});

test("diffConfigs pairs a same type+value token under a new path as a rename", () => {
  const base = config(
    new Map([
      ["ref.color.blue600", entry(["ref", "color", "blue600"], { $value: color("#0064e0") })],
    ]),
  );
  const head = config(
    new Map([
      ["ref.color.brand600", entry(["ref", "color", "brand600"], { $value: color("#0064e0") })],
    ]),
  );
  const diff = diffConfigs(base, head);
  expect(diff.renamed).toHaveLength(1);
  expect(diff.renamed[0]!.from.path).toEqual(["ref", "color", "blue600"]);
  expect(diff.renamed[0]!.to.path).toEqual(["ref", "color", "brand600"]);
  expect(diff.added).toHaveLength(0);
  expect(diff.removed).toHaveLength(0);
  expect(hasBreakingChanges(diff)).toBe(true);
});

test("diffConfigs reports a retype", () => {
  const base = config(
    new Map([
      [
        "system.spacing.md",
        entry(["system", "spacing", "md"], {
          $type: "dimension",
          $value: { value: 4, unit: "px" },
        }),
      ],
    ]),
  );
  const head = config(
    new Map([
      [
        "system.spacing.md",
        entry(["system", "spacing", "md"], { $type: "number", $value: { value: 4 } }),
      ],
    ]),
  );
  const diff = diffConfigs(base, head);
  expect(diff.retyped).toHaveLength(1);
  expect(diff.retyped[0]!.from.$type).toBe("dimension");
  expect(diff.retyped[0]!.to.$type).toBe("number");
  expect(hasBreakingChanges(diff)).toBe(true);
});

test("diffConfigs reports a value change", () => {
  const base = config(
    new Map([
      ["ref.color.blue500", entry(["ref", "color", "blue500"], { $value: color("#2694fe") })],
    ]),
  );
  const head = config(
    new Map([
      ["ref.color.blue500", entry(["ref", "color", "blue500"], { $value: color("#1e88ff") })],
    ]),
  );
  const diff = diffConfigs(base, head);
  expect(diff.changed).toHaveLength(1);
  expect(diff.changed[0]!.from.$value).toEqual(color("#2694fe"));
  expect(diff.changed[0]!.to.$value).toEqual(color("#1e88ff"));
  expect(hasBreakingChanges(diff)).toBe(false);
});

test("diffConfigs leaves an ambiguous rename group as separate add+remove", () => {
  const base = config(
    new Map([
      ["ref.color.a", entry(["ref", "color", "a"], { $value: color("#000000") })],
      ["ref.color.b", entry(["ref", "color", "b"], { $value: color("#000000") })],
    ]),
  );
  const head = config(
    new Map([
      ["ref.color.c", entry(["ref", "color", "c"], { $value: color("#000000") })],
      ["ref.color.d", entry(["ref", "color", "d"], { $value: color("#000000") })],
    ]),
  );
  const diff = diffConfigs(base, head);
  expect(diff.renamed).toHaveLength(0);
  expect(diff.added).toHaveLength(2);
  expect(diff.removed).toHaveLength(2);
});

test("diffConfigs reports theme override added/removed/changed", () => {
  const registry: TokenRegistry = new Map([
    ["ref.color.black", entry(["ref", "color", "black"], { $value: color("#000000") })],
  ]);
  const baseTheme: ThemeOverride = new Map([
    ["ref.color.removedOverride", color("#111111")],
    ["ref.color.changedOverride", color("#222222")],
  ]);
  const headTheme: ThemeOverride = new Map([
    ["ref.color.changedOverride", color("#333333")],
    ["ref.color.addedOverride", color("#444444")],
  ]);
  const base = config(registry, { dark: baseTheme });
  const head = config(registry, { dark: headTheme });
  const diff = diffConfigs(base, head);
  expect(diff.themes.changedThemes.dark).toBeDefined();
  expect(diff.themes.changedThemes.dark!.added).toHaveLength(1);
  expect(diff.themes.changedThemes.dark!.removed).toHaveLength(1);
  expect(diff.themes.changedThemes.dark!.changed).toHaveLength(1);
});

test("formatDiff reports no changes for an identical config", () => {
  const registry: TokenRegistry = new Map([
    ["ref.color.black", entry(["ref", "color", "black"], { $value: color("#000000") })],
  ]);
  const diff = diffConfigs(config(registry), config(registry));
  expect(formatDiff(diff)).toMatch(/No token changes/);
});

test("formatDiff shows human-readable values, not raw JSON, for a scalar change", () => {
  const base = config(
    new Map([
      [
        "ref.fontSize.base",
        entry(["ref", "fontSize", "base"], {
          $type: "dimension",
          $value: { value: 14, unit: "px" },
        }),
      ],
    ]),
  );
  const head = config(
    new Map([
      [
        "ref.fontSize.base",
        entry(["ref", "fontSize", "base"], {
          $type: "dimension",
          $value: { value: 16, unit: "px" },
        }),
      ],
    ]),
  );
  const output = formatDiff(diffConfigs(base, head));
  expect(output).toContain("ref.fontSize.base");
  expect(output).toContain("- 14px");
  expect(output).toContain("+ 16px");
  expect(output).not.toContain('"value"');
});

test("formatDiff reports only the nested member that changed inside a composite token", () => {
  const typographyValue = (fontSizePx: number) => ({
    fontFamily: { $value: { value: ["Arial"] } },
    fontSize: {
      $value: { value: fontSizePx, unit: "px" as const },
      alias: ["ref", "fontSize", "base"],
    },
    fontWeight: { $value: { value: 400 } },
    letterSpacing: { $value: { value: 0, unit: "px" as const } },
    lineHeight: { $value: { value: 1.4 } },
  });

  const registry = (fontSizePx: number): TokenRegistry =>
    new Map([
      [
        "system.textStyles.body",
        entry(["system", "textStyles", "body"], {
          $type: "typography",
          layer: "system",
          $value: typographyValue(fontSizePx) as never,
        }),
      ],
    ]);

  const diff = diffConfigs(config(registry(14)), config(registry(16)));
  expect(diff.changed).toHaveLength(1);

  const output = formatDiff(diff);
  expect(output).toContain("system.textStyles.body.fontSize");
  expect(output).toContain("- 14px");
  expect(output).toContain("+ 16px");
  expect(output).not.toContain("fontFamily");
  expect(output).not.toContain('"value"');
});

test("formatDiff renders markdown sections with a fenced diff block by default", () => {
  const base = config(
    new Map([
      ["ref.color.red", entry(["ref", "color", "red"], { $value: color("#ff0000") })],
      ["ref.color.blue", entry(["ref", "color", "blue"], { $value: color("#0000ff") })],
    ]),
  );
  const head = config(
    new Map([
      ["ref.color.blue", entry(["ref", "color", "blue"], { $value: color("#0000fe") })],
      ["ref.color.green", entry(["ref", "color", "green"], { $value: color("#00ff00") })],
    ]),
  );
  const output = formatDiff(diffConfigs(base, head));
  expect(output).toBe(formatDiff(diffConfigs(base, head), "markdown"));
  expect(output).toContain("## Breaking (1)");
  expect(output).toContain("- **removed** `ref.color.red`");
  expect(output).toContain("## Added (1)");
  expect(output).toContain("- `ref.color.green`");
  expect(output).toContain(
    "## Changed (1)\n\n```diff\n# ref.color.blue\n- #0000ff\n+ #0000fe\n```",
  );
});

test("formatDiff json is the raw diff plus its comparison context, empty or not", () => {
  const registry: TokenRegistry = new Map([
    ["ref.color.black", entry(["ref", "color", "black"], { $value: color("#000000") })],
  ]);
  const empty = diffConfigs(config(registry), config(registry));
  const context = { config: "recontent.config.ts", rev: "HEAD" };
  expect(JSON.parse(formatDiff(empty, "json", context))).toEqual({ ...context, ...empty });

  const added = diffConfigs(config(new Map()), config(registry));
  const parsed = JSON.parse(formatDiff(added, "json", context));
  expect(parsed.added).toHaveLength(1);
  expect(parsed.added[0].path).toEqual(["ref", "color", "black"]);
});

test("findExternalImports allows recontent and type-only imports", () => {
  expect(findExternalImports('import { defineConfig } from "recontent";', "config.ts")).toEqual([]);
  expect(findExternalImports('import type X from "./types";', "config.ts")).toEqual([]);
  expect(findExternalImports('import { type Y } from "./types";', "config.ts")).toEqual([]);
});

test("findExternalImports reports non-recontent specifiers", () => {
  expect(findExternalImports('import x from "./tokens";', "config.ts")).toEqual(["./tokens"]);
  expect(findExternalImports('export * from "./a";', "config.ts")).toEqual(["./a"]);
  expect(
    findExternalImports('await (async () => { await import("./b"); })();', "config.ts"),
  ).toEqual(["./b"]);
  expect(findExternalImports('const c = require("./c");', "config.ts")).toEqual(["./c"]);
});

function git(args: string[], cwd: string): void {
  const result = spawnSync("git", args, { cwd, encoding: "utf-8" });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
}

const COLORS_BASE = `import { tokens } from "recontent";

export const blue = tokens.color("#2563eb");
export const red = tokens.color("#dc2626");
`;

const CONFIG_BASE = `import {
  defineReferenceTokens,
  defineSystemTokens,
  defineComponentTokens,
  defineConfig,
} from "recontent";
import { blue, red } from "./colors";

const ref = defineReferenceTokens({
  color: { blue, red },
});

const system = defineSystemTokens({});
const components = defineComponentTokens({});

export default defineConfig({
  tokens: { ref, system, components },
});
`;

const COLORS_HEAD = `import { tokens } from "recontent";

export const blue = tokens.color("#1d4ed8");
export const red = tokens.color("#dc2626");
`;

const CONFIG_HEAD = `import {
  defineReferenceTokens,
  defineSystemTokens,
  defineComponentTokens,
  defineConfig,
} from "recontent";
import { blue } from "./colors";

const ref = defineReferenceTokens({
  color: { blue },
});

const system = defineSystemTokens({});
const components = defineComponentTokens({});

export default defineConfig({
  tokens: { ref, system, components },
});
`;

describe("runDiff against a config that imports a sibling file", () => {
  let repoDir: string;
  let logSpy: ReturnType<typeof jest.spyOn>;
  let stdoutSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(async () => {
    repoDir = await mkdtemp(path.join(process.cwd(), "test", "diff-fixture-"));
    git(["init", "-q"], repoDir);
    git(
      [
        "-c",
        "user.email=test@example.com",
        "-c",
        "user.name=Test",
        "config",
        "commit.gpgsign",
        "false",
      ],
      repoDir,
    );

    await writeFile(path.join(repoDir, "colors.ts"), COLORS_BASE, "utf-8");
    await writeFile(path.join(repoDir, "recontent.config.ts"), CONFIG_BASE, "utf-8");
    git(["add", "-A"], repoDir);
    git(
      ["-c", "user.email=test@example.com", "-c", "user.name=Test", "commit", "-q", "-m", "base"],
      repoDir,
    );

    // Working tree now diverges from HEAD: a value change in the imported
    // file, and a breaking removal (dropping `red`) in the config itself.
    await writeFile(path.join(repoDir, "colors.ts"), COLORS_HEAD, "utf-8");
    await writeFile(path.join(repoDir, "recontent.config.ts"), CONFIG_HEAD, "utf-8");

    logSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    stdoutSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(async () => {
    logSpy.mockRestore();
    stdoutSpy.mockRestore();
    process.exitCode = undefined;
    await rm(repoDir, { recursive: true, force: true });
  });

  test("reports the change instead of erroring on the non-recontent import", async () => {
    await runDiff({
      cwd: repoDir,
      configPath: path.join(repoDir, "recontent.config.ts"),
      rev: "HEAD",
    });

    const output = stdoutSpy.mock.calls.map((call: unknown[]) => call.join(" ")).join("\n");
    expect(output).toContain("ref.color.blue");
    expect(output).toContain("#2563eb");
    expect(output).toContain("#1d4ed8");
    expect(output).toContain("ref.color.red");
  });

  test("--format json prints only the parseable diff on stdout", async () => {
    await runDiff({
      cwd: repoDir,
      configPath: path.join(repoDir, "recontent.config.ts"),
      rev: "HEAD",
      format: "json",
    });

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(String(stdoutSpy.mock.calls[0]![0]));
    expect(parsed.removed.map((e: TokenEntry) => e.path.join("."))).toEqual(["ref.color.red"]);
    expect(parsed.changed).toHaveLength(1);
  });

  test("--fail-on-breaking exits 1 on the removed token", async () => {
    expect(process.exitCode).toBeUndefined();

    await runDiff({
      cwd: repoDir,
      configPath: path.join(repoDir, "recontent.config.ts"),
      rev: "HEAD",
      failOnBreaking: true,
    });

    expect(process.exitCode).toBe(1);
  });
});

const MALICIOUS_CONFIG = `import { writeFileSync } from "node:fs";
import { defineReferenceTokens, defineSystemTokens, defineComponentTokens, defineConfig } from "recontent";

// Top-level side effect: if this file is ever loaded, it must leave a trace.
writeFileSync(process.env.RECONTENT_DIFF_TEST_SENTINEL!, "pwned");

const ref = defineReferenceTokens({});
const system = defineSystemTokens({});
const components = defineComponentTokens({});

export default defineConfig({
  tokens: { ref, system, components },
});
`;

describe("runDiff rejects a revision that is not an ancestor of HEAD (S1)", () => {
  let repoDir: string;
  let sentinelPath: string;
  let logSpy: ReturnType<typeof jest.spyOn>;
  let stdoutSpy: ReturnType<typeof jest.spyOn>;
  let previousSentinelEnv: string | undefined;

  beforeEach(async () => {
    repoDir = await mkdtemp(path.join(process.cwd(), "test", "diff-fixture-"));
    sentinelPath = path.join(repoDir, "..", `sentinel-${path.basename(repoDir)}.txt`);
    previousSentinelEnv = process.env.RECONTENT_DIFF_TEST_SENTINEL;
    process.env.RECONTENT_DIFF_TEST_SENTINEL = sentinelPath;

    git(["init", "-q"], repoDir);
    git(
      [
        "-c",
        "user.email=test@example.com",
        "-c",
        "user.name=Test",
        "config",
        "commit.gpgsign",
        "false",
      ],
      repoDir,
    );

    await writeFile(path.join(repoDir, "recontent.config.ts"), CONFIG_BASE, "utf-8");
    await writeFile(path.join(repoDir, "colors.ts"), COLORS_BASE, "utf-8");
    git(["add", "-A"], repoDir);
    git(
      ["-c", "user.email=test@example.com", "-c", "user.name=Test", "commit", "-q", "-m", "base"],
      repoDir,
    );
    git(["tag", "v1"], repoDir);

    await writeFile(path.join(repoDir, "colors.ts"), COLORS_HEAD, "utf-8");
    git(["add", "-A"], repoDir);
    git(
      ["-c", "user.email=test@example.com", "-c", "user.name=Test", "commit", "-q", "-m", "second"],
      repoDir,
    );

    // A branch forked off the base commit — never merged into the branch
    // whose HEAD we diff against below — carrying a config with an
    // observable top-level side effect.
    const mainBranch = spawnSync("git", ["symbolic-ref", "--short", "HEAD"], {
      cwd: repoDir,
      encoding: "utf-8",
    }).stdout.trim();

    git(["branch", "malicious", "v1"], repoDir);
    git(["checkout", "-q", "malicious"], repoDir);
    await writeFile(path.join(repoDir, "recontent.config.ts"), MALICIOUS_CONFIG, "utf-8");
    git(["add", "-A"], repoDir);
    git(
      [
        "-c",
        "user.email=test@example.com",
        "-c",
        "user.name=Test",
        "commit",
        "-q",
        "-m",
        "malicious",
      ],
      repoDir,
    );
    git(["checkout", "-q", mainBranch], repoDir);

    // The current checkout's own config, used for every `runDiff` call below.
    await writeFile(path.join(repoDir, "recontent.config.ts"), CONFIG_HEAD, "utf-8");

    logSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    stdoutSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(async () => {
    logSpy.mockRestore();
    stdoutSpy.mockRestore();
    process.exitCode = undefined;
    if (previousSentinelEnv === undefined) {
      delete process.env.RECONTENT_DIFF_TEST_SENTINEL;
    } else {
      process.env.RECONTENT_DIFF_TEST_SENTINEL = previousSentinelEnv;
    }
    await rm(sentinelPath, { force: true });
    await rm(repoDir, { recursive: true, force: true });
  });

  test("refuses a branch that is not an ancestor of HEAD, and never executes its config", async () => {
    await expect(
      runDiff({
        cwd: repoDir,
        configPath: path.join(repoDir, "recontent.config.ts"),
        rev: "malicious",
      }),
    ).rejects.toThrow(/not an ancestor of HEAD/);

    await expect(rm(sentinelPath)).rejects.toThrow();
  });

  test("still allows the default rev (HEAD)", async () => {
    await expect(
      runDiff({ cwd: repoDir, configPath: path.join(repoDir, "recontent.config.ts") }),
    ).resolves.not.toThrow();
  });

  test("still allows HEAD~1", async () => {
    await expect(
      runDiff({
        cwd: repoDir,
        configPath: path.join(repoDir, "recontent.config.ts"),
        rev: "HEAD~1",
      }),
    ).resolves.not.toThrow();
  });

  test("still allows a tag on merged history", async () => {
    await expect(
      runDiff({ cwd: repoDir, configPath: path.join(repoDir, "recontent.config.ts"), rev: "v1" }),
    ).resolves.not.toThrow();
  });
});
