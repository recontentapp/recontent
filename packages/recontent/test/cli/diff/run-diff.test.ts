import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { TokenEntry } from "../../../src/token-model/registry.js";
import { runDiff } from "../../../src/cli/commands/diff/index.js";
import { commitAll, git } from "../../helpers/git.js";

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
    git(repoDir, "init", "-q");

    await writeFile(path.join(repoDir, "colors.ts"), COLORS_BASE, "utf-8");
    await writeFile(path.join(repoDir, "recontent.config.ts"), CONFIG_BASE, "utf-8");
    commitAll(repoDir, "base");

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

  // The e2e specs cover the plural; this is the only place the singular message is asserted.
  test("--fail-on-breaking exits 1 on the removed token, counting it", async () => {
    await runDiff({
      cwd: repoDir,
      configPath: path.join(repoDir, "recontent.config.ts"),
      rev: "HEAD",
      failOnBreaking: true,
    });

    expect(process.exitCode).toBe(1);
    expect(logSpy).toHaveBeenCalledWith("error: 1 breaking change found");
  });
});

describe("runDiff against a config that imports through a tsconfig paths alias", () => {
  let repoDir: string;
  let stdoutSpy: ReturnType<typeof jest.spyOn>;
  let logSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(async () => {
    repoDir = await mkdtemp(path.join(process.cwd(), "test", "diff-alias-fixture-"));
    git(repoDir, "init", "-q");
    await writeFile(
      path.join(repoDir, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@tokens/*": ["tokens/*"] } } }),
      "utf-8",
    );
    await mkdir(path.join(repoDir, "tokens"));
    await writeFile(
      path.join(repoDir, "recontent.config.ts"),
      CONFIG_BASE.replace('"./colors"', '"@tokens/colors"'),
      "utf-8",
    );
    await writeFile(path.join(repoDir, "tokens", "colors.ts"), COLORS_BASE, "utf-8");
    commitAll(repoDir, "base");
    await writeFile(path.join(repoDir, "tokens", "colors.ts"), COLORS_HEAD, "utf-8");

    logSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    stdoutSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(async () => {
    logSpy.mockRestore();
    stdoutSpy.mockRestore();
    process.exitCode = undefined;
    await rm(repoDir, { recursive: true, force: true });
  });

  test("loads the base revision's tokens, not the working tree's", async () => {
    await runDiff({
      cwd: repoDir,
      configPath: path.join(repoDir, "recontent.config.ts"),
      rev: "HEAD",
      format: "json",
    });

    const parsed = JSON.parse(String(stdoutSpy.mock.calls[0]![0]));
    expect(parsed.tokens.changed.map((e: { to: TokenEntry }) => e.to.path.join("."))).toEqual([
      "ref.color.blue",
    ]);
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

    git(repoDir, "init", "-q");
    await writeFile(path.join(repoDir, "recontent.config.ts"), CONFIG_BASE, "utf-8");
    await writeFile(path.join(repoDir, "colors.ts"), COLORS_BASE, "utf-8");
    commitAll(repoDir, "base");
    git(repoDir, "tag", "v1");

    await writeFile(path.join(repoDir, "colors.ts"), COLORS_HEAD, "utf-8");
    commitAll(repoDir, "second");

    // A branch forked off the base commit — never merged into the branch
    // whose HEAD we diff against below — carrying a config with an
    // observable top-level side effect.
    git(repoDir, "checkout", "-q", "-b", "malicious", "v1");
    await writeFile(path.join(repoDir, "recontent.config.ts"), MALICIOUS_CONFIG, "utf-8");
    commitAll(repoDir, "malicious");
    git(repoDir, "checkout", "-q", "-");

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

    expect(existsSync(sentinelPath)).toBe(false);
  });

  // The working tree drops `red`; only the base commit still has the old `blue`.
  test.each([
    ["the default rev (HEAD)", undefined, ["ref.color.red"], ["#2563eb"]],
    ["HEAD~1", "HEAD~1", ["ref.color.red", "#2563eb"], []],
    ["a tag on merged history", "v1", ["ref.color.red", "#2563eb"], []],
  ])("still allows %s", async (_name, rev, expected, unexpected) => {
    await runDiff({ cwd: repoDir, configPath: path.join(repoDir, "recontent.config.ts"), rev });

    const output = stdoutSpy.mock.calls.map((call: unknown[]) => call.join(" ")).join("\n");
    for (const text of expected) expect(output).toContain(text);
    for (const text of unexpected) expect(output).not.toContain(text);
  });
});
