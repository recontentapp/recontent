import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "@jest/globals";
import { binPath, copyFixture, makeScratchDir, runCli, useCliScratch } from "../../helpers/cli.js";

useCliScratch();

describe("recontent build", () => {
  test("aborts without writing output when an alias is broken, reporting it once with a count summary", () => {
    const dir = makeScratchDir("build-broken-alias");
    copyFixture("broken-alias", dir);

    const result = runCli(["--cwd", dir, "build"]);

    expect(result.status).toBe(1);
    expect(existsSync(path.join(dir, "dist/tokens.css"))).toBe(false);
    const lines = result.stderr.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^error: Broken alias/);
    expect(lines[1]).toBe("error: build failed: 1 error, 0 warnings");
  });

  test("warns, and still exits 0, when the config has no plugins", () => {
    const dir = makeScratchDir("build-no-plugins");
    expect(runCli(["--cwd", dir, "init", "neutral"]).status).toBe(0);

    const result = runCli(["--cwd", dir, "build"]);

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("warning: No plugins configured in recontent.config.ts");
  });

  test("runs the configured plugins, listing the files written relative to --cwd", () => {
    const dir = makeScratchDir("build");
    copyFixture("valid", dir);

    const result = runCli(["--cwd", dir, "build"]);

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("Wrote dist/tokens.css\n");
    expect(result.stderr).not.toContain(dir);
    expect(result.stderr).toMatch(/Wrote \d+ files\n$/);

    const css = readFileSync(path.join(dir, "dist/tokens.css"), "utf-8");
    expect(css).toContain("--system-color-accent");
    expect(css).toContain("#2563eb");

    const json = JSON.parse(readFileSync(path.join(dir, "dist/tokens.tokens.json"), "utf-8"));
    expect(json.ref.color.brand.primary.$value.hex).toBe("#2563eb");
    // `system.color.accent` aliases `ref.color.brand.primary` — DTCG
    // represents that as a `{...}` reference rather than a resolved value.
    expect(json.system.color.accent.$value).toBe("{ref.color.brand.primary}");
  });

  describe("--check", () => {
    test("passes right after a build", () => {
      const dir = makeScratchDir("build-check-fresh");
      copyFixture("valid", dir);
      expect(runCli(["--cwd", dir, "build"]).status).toBe(0);

      const result = runCli(["--cwd", dir, "build", "--check"]);

      expect(result.status).toBe(0);
      expect(result.stderr).toMatch(/\d+ files up to date\n$/);
    });

    test("fails on a file that differs, and writes nothing", () => {
      const dir = makeScratchDir("build-check-stale");
      copyFixture("valid", dir);
      runCli(["--cwd", dir, "build"]);
      const cssPath = path.join(dir, "dist/tokens.css");
      writeFileSync(cssPath, "/* edited */\n");

      const result = runCli(["--cwd", dir, "build", "--check"]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("Stale dist/tokens.css");
      expect(result.stderr).toMatch(
        /error: check failed: 1 of \d+ files out of date; run `recontent build`\n$/,
      );
      expect(readFileSync(cssPath, "utf-8")).toBe("/* edited */\n");
    });

    test("fails on a missing file without creating the output directory", () => {
      const dir = makeScratchDir("build-check-missing");
      copyFixture("valid", dir);

      const result = runCli(["--cwd", dir, "build", "--check"]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("Missing dist/tokens.css");
      expect(existsSync(path.join(dir, "dist"))).toBe(false);
    });

    test("still fails with the build summary when the build itself is broken", () => {
      const dir = makeScratchDir("build-check-broken");
      copyFixture("broken-alias", dir);

      const result = runCli(["--cwd", dir, "build", "--check"]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("error: build failed: 1 error, 0 warnings");
    });

    test("cannot be combined with --watch", () => {
      const dir = makeScratchDir("build-check-watch");
      copyFixture("valid", dir);

      const result = runCli(["--cwd", dir, "build", "--check", "--watch"]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("cannot be used with");
    });
  });

  test("a missing config is a failure: -c names the file, the default searches for one", () => {
    const dir = makeScratchDir("build-missing-config");

    const explicit = runCli(["--cwd", dir, "build", "-c", "other.config.ts"]);
    expect(explicit.status).toBe(1);
    expect(explicit.stderr).toContain("Config file not found");
    expect(explicit.stderr).toContain("other.config.ts");
    expect(explicit.stderr).not.toContain("Could not find a recontent.config");

    const searched = runCli(["--cwd", dir, "build"]);
    expect(searched.status).toBe(1);
    expect(searched.stderr).toContain("Could not find a recontent.config");
  });

  test("reports a config load error once, without internal paths", () => {
    const dir = makeScratchDir("build-bad-import");
    writeFileSync(path.join(dir, "recontent.config.ts"), 'import "does-not-exist-pkg";\n');

    const result = runCli(["--cwd", dir, "build"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Failed to load config");
    expect(result.stderr).not.toContain("caused by");
    expect(result.stderr).not.toContain("Require stack");
  });
});

describe("a theme overriding a token that does not exist", () => {
  function danglingProject(prefix: string): string {
    const dir = makeScratchDir(prefix);
    copyFixture("valid", dir);
    const configPath = path.join(dir, "recontent.config.ts");
    writeFileSync(
      configPath,
      readFileSync(configPath, "utf-8")
        .replace("  defineSystemTokens,\n", "  defineSystemTokens,\n  defineTheme,\n")
        .replace(
          "const components =",
          'const other = defineReferenceTokens({ color: { nope: tokens.color("#000000") } });\n' +
            'const dark = defineTheme(other, { color: { nope: tokens.color("#111111") } });\nconst components =',
        )
        .replace("  plugins: [", "  themes: { dark },\n  plugins: ["),
    );
    return dir;
  }

  test("fails build with one message, before any plugin writes", () => {
    const dir = danglingProject("build-dangling-override");

    const result = runCli(["--cwd", dir, "build"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Theme "dark" overrides unknown token "ref.color.nope"');
    expect(result.stderr.match(/ref\.color\.nope/g)).toHaveLength(1);
    expect(existsSync(path.join(dir, "dist"))).toBe(false);
  });

  test("fails inspect too", () => {
    const dir = danglingProject("inspect-dangling-override");

    const result = runCli(["--cwd", dir, "inspect"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Theme "dark" overrides unknown token "ref.color.nope"');
  });
});

describe("recontent build plugin diagnostics", () => {
  test("names the plugin and the token a diagnostic is about", () => {
    const dir = makeScratchDir("build-plugin-diagnostic");
    writeFileSync(
      path.join(dir, "recontent.config.ts"),
      `import { defineConfig, defineReferenceTokens, tokens } from "recontent";
export default defineConfig({
  tokens: { ref: defineReferenceTokens({ color: { blue: tokens.color("#2563eb") } }) },
  plugins: [
    {
      name: "acme:lint",
      dependsOn: ["tokens"],
      validate: () => [{ severity: "warning", message: "no description", path: ["ref", "color", "blue"] }],
    },
  ],
});
`,
    );

    const result = runCli(["--cwd", dir, "build"]);

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("warning: [acme:lint] no description (ref.color.blue)");
  });
});

describe("recontent build --watch", () => {
  async function waitFor(condition: () => boolean, what: string, timeoutMs = 20_000) {
    const deadline = Date.now() + timeoutMs;
    while (!condition()) {
      if (Date.now() > deadline) throw new Error(`Timed out waiting for ${what}`);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  test("rebuilds with the edited config, not a cached copy of it", async () => {
    const dir = makeScratchDir("build-watch-edit");
    copyFixture("valid", dir);
    const configPath = path.join(dir, "recontent.config.ts");
    const cssPath = path.join(dir, "dist/tokens.css");
    const watcher = spawn("node", [binPath, "build", "--watch", "--cwd", dir], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    watcher.stderr.on("data", (chunk) => (stderr += String(chunk)));

    try {
      // Edits made before the watchers are installed are not seen.
      await waitFor(() => stderr.includes("Watching "), `the watcher to start\n${stderr}`);
      expect(readFileSync(cssPath, "utf-8")).toContain("#2563eb");

      writeFileSync(configPath, readFileSync(configPath, "utf-8").replace("#2563eb", "#dc2626"));

      await waitFor(
        () => readFileSync(cssPath, "utf-8").includes("#dc2626"),
        `the rebuild after the edit\n${stderr}`,
      );
      expect(readFileSync(cssPath, "utf-8")).not.toContain("#2563eb");
    } finally {
      watcher.kill("SIGINT");
    }
  }, 60_000);
});
