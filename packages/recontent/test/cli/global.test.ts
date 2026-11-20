import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "@jest/globals";
import { binPath, copyFixture, makeScratchDir, runCli, useCliScratch } from "../helpers/cli.js";

useCliScratch();

describe("recontent (global behavior)", () => {
  test("a bare invocation prints help on stdout and exits 0", () => {
    const result = runCli([]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Usage: recontent");
  });

  test("a usage error is a single line plus a pointer to --help, not the full help", () => {
    const result = runCli(["bogus"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("error: unknown command 'bogus'");
    expect(result.stderr).toContain("--help");
    expect(result.stderr).not.toContain("Usage:");
  });

  test("global options work after the subcommand", () => {
    const dir = makeScratchDir("global-after");
    copyFixture("valid", dir);

    expect(runCli(["build", "--cwd", dir, "--log-level", "debug"]).status).toBe(0);
    expect(existsSync(path.join(dir, "dist/tokens.css"))).toBe(true);
  });

  test("rejects a --cwd that is not a directory", () => {
    const result = runCli(["--cwd", "/nonexistent/recontent", "build"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("directory not found");
  });

  test("blames RECONTENT_LOG_LEVEL, not --log-level, for a bad environment value", () => {
    const dir = makeScratchDir("log-level-env");
    copyFixture("valid", dir);
    const result = spawnSync("node", [binPath, "--cwd", dir, "build"], {
      encoding: "utf-8",
      env: { ...process.env, RECONTENT_LOG_LEVEL: "loud" },
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('$RECONTENT_LOG_LEVEL must be "info" or "debug"');
    expect(result.stderr).not.toContain("--log-level");
  });
});
