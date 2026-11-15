import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "@jest/globals";
import { PRESET_NAMES } from "../../../src/cli/commands/init/presets/index.js";
import { copyFixture, makeScratchDir, runCli, useCliScratch } from "../../helpers/cli.js";

useCliScratch();

describe("recontent init", () => {
  test("--force overwrites a stale config, and succeeds on an up-to-date one, run after run", () => {
    const dir = makeScratchDir("init-force");
    runCli(["--cwd", dir, "init", "neutral"]);
    const configPath = path.join(dir, "recontent.config.ts");
    writeFileSync(configPath, "// stale\n");

    expect(runCli(["--cwd", dir, "init", "neutral", "--force"]).status).toBe(0);
    expect(readFileSync(configPath, "utf-8")).toContain("defineConfig(");

    const again = runCli(["--cwd", dir, "init", "neutral", "--force"]);
    expect(again.status).toBe(0);
    expect(again.stderr).not.toContain("already exists");
  });

  test("-c may point outside --cwd", () => {
    const dir = makeScratchDir("init-config-outside");
    const cwd = path.join(dir, "app");
    mkdirSync(cwd);

    const result = runCli(["--cwd", cwd, "init", "neutral", "-c", "../shared.config.ts"]);

    expect(result.status).toBe(0);
    expect(existsSync(path.join(dir, "shared.config.ts"))).toBe(true);
  });

  test("honors -c for the file it writes, and says so in its messages", () => {
    const dir = makeScratchDir("init-config-flag");
    const result = runCli(["--cwd", dir, "init", "neutral", "-c", "tokens.config.ts"]);

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("Created tokens.config.ts");
    expect(result.stderr).toContain("recontent build");
    expect(existsSync(path.join(dir, "tokens.config.ts"))).toBe(true);

    const again = runCli(["--cwd", dir, "init", "neutral", "-c", "tokens.config.ts"]);
    expect(again.status).toBe(1);
    expect(again.stderr).toContain("tokens.config.ts already exists");
  });

  test("requires a preset", () => {
    const dir = makeScratchDir("init-nopreset");
    const result = runCli(["--cwd", dir, "init"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("preset");
    expect(existsSync(path.join(dir, "recontent.config.ts"))).toBe(false);
  });

  test("rejects an unknown preset and lists the choices", () => {
    const dir = makeScratchDir("init-unknown");
    const result = runCli(["--cwd", dir, "init", "bootstrap"]);

    expect(result.status).toBe(1);
    for (const name of PRESET_NAMES) {
      expect(result.stderr).toContain(name);
    }
  });

  test.each(PRESET_NAMES)("the %s preset scaffolds a config that builds", (name) => {
    const dir = makeScratchDir(`init-${name}`);

    expect(runCli(["--cwd", dir, "init", name]).status).toBe(0);
    expect(runCli(["--cwd", dir, "build"]).status).toBe(0);
  });
});

describe("recontent init --dtcg", () => {
  const resolver = "fixture.resolver.json";

  function initFromFixture(prefix: string, extraArgs: string[] = []) {
    const dir = makeScratchDir(prefix);
    copyFixture("dtcg", dir);
    const result = runCli(["--cwd", dir, "init", "--dtcg", resolver, ...extraArgs]);
    return { dir, result };
  }

  test("generates a config from a resolver that builds", () => {
    const { dir, result } = initFromFixture("init-from");

    expect(result.status).toBe(0);
    expect(result.stderr).toContain(
      "Imported 30 tokens (18 ref, 12 system) and 2 themes; skipped 6 entries",
    );
    expect(result.stderr).toContain('warning: Skipped "misc.fluid"');
    const config = readFileSync(path.join(dir, "recontent.config.ts"), "utf-8");
    expect(config).toContain("defineTheme(");

    expect(runCli(["--cwd", dir, "build"]).status).toBe(0);
  });

  test("is mutually exclusive with a preset", () => {
    const dir = makeScratchDir("init-from-and-preset");
    copyFixture("dtcg", dir);
    const result = runCli(["--cwd", dir, "init", "--dtcg", resolver, "neutral"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("mutually exclusive");
    expect(existsSync(path.join(dir, "recontent.config.ts"))).toBe(false);
  });

  test("accepts token files and directories", () => {
    const dir = makeScratchDir("init-from-files");
    copyFixture("dtcg", dir);
    const result = runCli([
      "--cwd",
      dir,
      "init",
      "--dtcg",
      "primitives.tokens.json",
      "--dtcg",
      "semantic.tokens.json",
    ]);

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("and 0 themes");
    expect(runCli(["--cwd", dir, "build"]).status).toBe(0);
  });

  test("refuses to overwrite an existing config without --force", () => {
    const { dir } = initFromFixture("init-from-noforce");
    const configPath = path.join(dir, "recontent.config.ts");
    writeFileSync(configPath, "// mine\n");

    const result = runCli(["--cwd", dir, "init", "--dtcg", resolver]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("--force");
    expect(readFileSync(configPath, "utf-8")).toBe("// mine\n");

    expect(runCli(["--cwd", dir, "init", "--dtcg", resolver, "--force"]).status).toBe(0);
    expect(readFileSync(configPath, "utf-8")).toContain("defineConfig(");
  });

  test("fails with a clear error for a missing source", () => {
    const dir = makeScratchDir("init-from-missing");
    const result = runCli(["--cwd", dir, "init", "--dtcg", "nope.resolver.json"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("does not exist");
    expect(existsSync(path.join(dir, "recontent.config.ts"))).toBe(false);
  });
});
