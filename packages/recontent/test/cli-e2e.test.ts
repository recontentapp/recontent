/**
 * End-to-end tests that invoke the built CLI binary (dist/cli/bin.mjs) as a
 * subprocess, the same way a real user would, and assert on exit codes,
 * stdout/stderr, and files written to disk. This exercises `bin.ts`'s
 * argument parsing and process-exit contract in a way unit tests on
 * individual command modules cannot.
 *
 * Requires `yarn build` to have run first (CI's `test` job depends on
 * `build` and downloads its artifacts before running `yarn test`).
 *
 * Fixtures live under `test/fixtures/**` and are copied into a scratch
 * directory nested inside the repo (rather than under the OS tmpdir) so that
 * `require.resolve("recontent")` — which the CLI uses to load configs —
 * finds this workspace's `node_modules/recontent` symlink by walking up
 * parent directories.
 */
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeAll, describe, expect, test } from "@jest/globals";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(dirname, "..");
const repoRoot = path.resolve(packageRoot, "../..");
const binPath = path.join(packageRoot, "dist/cli/bin.mjs");
const fixturesDir = path.join(dirname, "fixtures");
const scratchRoot = path.join(repoRoot, "packages/recontent/test/.e2e-tmp");

beforeAll(() => {
  if (!existsSync(binPath)) {
    throw new Error(`${binPath} does not exist. Run "yarn build" before running this test file.`);
  }
});

afterEach(() => {
  rmSync(scratchRoot, { recursive: true, force: true });
});

function makeScratchDir(prefix: string): string {
  mkdirSync(scratchRoot, { recursive: true });
  return mkdtempSync(path.join(scratchRoot, `${prefix}-`));
}

function copyFixture(name: string, destDir: string): void {
  cpSync(path.join(fixturesDir, name), destDir, { recursive: true });
}

function runCli(args: string[], options?: { cwd?: string }) {
  const result = spawnSync("node", [binPath, ...args], {
    cwd: options?.cwd ?? packageRoot,
    encoding: "utf-8",
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

describe("recontent init", () => {
  test("scaffolds a config file and exits 0", () => {
    const dir = makeScratchDir("init");
    const result = runCli(["--cwd", dir, "init"]);

    expect(result.status).toBe(0);
    const configPath = path.join(dir, "recontent.config.ts");
    expect(existsSync(configPath)).toBe(true);
    expect(readFileSync(configPath, "utf-8")).toContain("defineConfig(");
  });

  test("refuses to overwrite an existing config without --force", () => {
    const dir = makeScratchDir("init-noforce");
    expect(runCli(["--cwd", dir, "init"]).status).toBe(0);

    const configPath = path.join(dir, "recontent.config.ts");
    writeFileSync(configPath, "// user-edited, do not clobber\n");

    const result = runCli(["--cwd", dir, "init"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("already exists");
    expect(readFileSync(configPath, "utf-8")).toBe("// user-edited, do not clobber\n");
  });

  test("--force overwrites an existing config", () => {
    const dir = makeScratchDir("init-force");
    runCli(["--cwd", dir, "init"]);
    const configPath = path.join(dir, "recontent.config.ts");
    writeFileSync(configPath, "// stale\n");

    const result = runCli(["--cwd", dir, "init", "--force"]);
    expect(result.status).toBe(0);
    expect(readFileSync(configPath, "utf-8")).toContain("defineConfig(");
  });
});

describe("recontent build", () => {
  test("runs the configured css plugin and writes tokens.css", () => {
    const dir = makeScratchDir("build");
    copyFixture("valid", dir);

    const result = runCli(["--cwd", dir, "build"]);

    expect(result.status).toBe(0);
    const outputPath = path.join(dir, "dist/tokens.css");
    expect(existsSync(outputPath)).toBe(true);
    const css = readFileSync(outputPath, "utf-8");
    expect(css).toContain("--system-color-accent");
    expect(css).toContain("#2563eb");
  });

  test("fails with a non-zero exit code when the config file is missing", () => {
    const dir = makeScratchDir("build-missing-config");

    const result = runCli(["--cwd", dir, "build"]);

    expect(result.status).not.toBe(0);
    expect(result.stderr.toLowerCase()).toContain("recontent.config");
  });
});

describe("recontent doctor", () => {
  test("exits 0 and reports no issues for a valid config", () => {
    const dir = makeScratchDir("doctor-valid");
    copyFixture("valid", dir);

    const result = runCli(["--cwd", dir, "doctor"]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("No issues found");
  });

  test("exits 1 and reports a missing plugin dependency", () => {
    const dir = makeScratchDir("doctor-missing-dep");
    copyFixture("missing-dependency", dir);

    const result = runCli(["--cwd", dir, "doctor"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("@recontent-e2e/does-not-exist");
    expect(result.stderr).toContain("Missing dependency");
  });
});

describe("recontent export", () => {
  test("html writes a report containing every token path", () => {
    const dir = makeScratchDir("export-html");
    copyFixture("valid", dir);

    const result = runCli(["--cwd", dir, "export", "html"]);

    expect(result.status).toBe(0);
    const outputPath = path.join(dir, "tokens.html");
    expect(existsSync(outputPath)).toBe(true);
    const html = readFileSync(outputPath, "utf-8");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("system.color.accent");
  });

  test("dtcg writes a valid tokens.tokens.json file", () => {
    const dir = makeScratchDir("export-dtcg");
    copyFixture("valid", dir);

    const result = runCli(["--cwd", dir, "export", "dtcg"]);

    expect(result.status).toBe(0);
    const outputPath = path.join(dir, "tokens.tokens.json");
    expect(existsSync(outputPath)).toBe(true);
    const json = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(json.ref.color.brand.primary.$value.hex).toBe("#2563eb");
    // `system.color.accent` aliases `ref.color.brand.primary` — DTCG
    // represents that as a `{...}` reference rather than a resolved value.
    expect(json.system.color.accent.$value).toBe("{ref.color.brand.primary}");
  });

  test("bare `export` prints help to stderr and exits with code 2", () => {
    const dir = makeScratchDir("export-bare");
    copyFixture("valid", dir);

    const result = runCli(["--cwd", dir, "export"]);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("Usage:");
  });
});

describe("recontent diff", () => {
  function git(args: string[], cwd: string): void {
    const result = spawnSync("git", args, { cwd, encoding: "utf-8" });
    if (result.status !== 0) {
      throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
    }
  }

  function initRepoWithCommit(dir: string): void {
    git(["init", "-q"], dir);
    git(["config", "user.email", "e2e@example.com"], dir);
    git(["config", "user.name", "e2e"], dir);
    git(["add", "-A"], dir);
    git(["commit", "-q", "-m", "initial"], dir);
  }

  test("reports no changes when nothing differs from HEAD", () => {
    const dir = makeScratchDir("diff-none");
    copyFixture("valid", dir);
    initRepoWithCommit(dir);

    const result = runCli(["--cwd", dir, "diff"]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("No token changes between the working tree and HEAD");
  });

  test("reports a changed token value against HEAD", () => {
    const dir = makeScratchDir("diff-changed");
    copyFixture("valid", dir);
    initRepoWithCommit(dir);

    const configPath = path.join(dir, "recontent.config.ts");
    const original = readFileSync(configPath, "utf-8");
    writeFileSync(configPath, original.replace("#2563eb", "#ff0000"));

    const result = runCli(["--cwd", dir, "diff"]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Changed");
    expect(result.stdout).toContain("ref.color.brand.primary");
  });

  test("--fail-on-breaking exits 1 when a token is removed", () => {
    const dir = makeScratchDir("diff-breaking");
    copyFixture("valid", dir);
    initRepoWithCommit(dir);

    const configPath = path.join(dir, "recontent.config.ts");
    const original = readFileSync(configPath, "utf-8");
    // Remove the `spacing` token from both the ref and system trees (a
    // dangling `ref.spacing[4]` reference in `system` would otherwise throw
    // while loading the config, rather than producing a clean diff).
    const withoutSpacing = original
      .replace('  spacing: {\n    4: tokens.dimension("4px"),\n  },\n', "")
      .replace("  spacing: {\n    sm: ref.spacing[4],\n  },\n", "");
    expect(withoutSpacing).not.toContain("spacing");
    writeFileSync(configPath, withoutSpacing);

    const withoutBreaking = runCli(["--cwd", dir, "diff"]);
    expect(withoutBreaking.status).toBe(0);
    expect(withoutBreaking.stdout).toContain("Breaking");

    const withBreaking = runCli(["--cwd", dir, "diff", "--fail-on-breaking"]);
    expect(withBreaking.status).toBe(1);
  });
});
