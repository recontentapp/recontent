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
import { FONT_WEIGHT_NUMERIC } from "@recontentapp/core";
import { flattenDocument } from "../src/cli/dtcg-import/flatten.js";
import { loadSources } from "../src/cli/dtcg-import/load.js";
import { aliasTarget, isObject, lookupToken } from "../src/cli/dtcg-import/types.js";
import type { TokenMap } from "../src/cli/dtcg-import/types.js";
import { PRESET_NAMES } from "../src/cli/presets/index.js";

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

describe("recontent init", () => {
  test("scaffolds a config file and exits 0", () => {
    const dir = makeScratchDir("init");
    const result = runCli(["--cwd", dir, "init", "neutral"]);

    expect(result.status).toBe(0);
    const configPath = path.join(dir, "recontent.config.ts");
    expect(existsSync(configPath)).toBe(true);
    expect(readFileSync(configPath, "utf-8")).toContain("defineConfig(");
  });

  test("refuses to overwrite an existing config without --force", () => {
    const dir = makeScratchDir("init-noforce");
    expect(runCli(["--cwd", dir, "init", "neutral"]).status).toBe(0);

    const configPath = path.join(dir, "recontent.config.ts");
    writeFileSync(configPath, "// user-edited, do not clobber\n");

    const result = runCli(["--cwd", dir, "init", "neutral"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("already exists");
    expect(readFileSync(configPath, "utf-8")).toBe("// user-edited, do not clobber\n");
  });

  test("--force overwrites an existing config", () => {
    const dir = makeScratchDir("init-force");
    runCli(["--cwd", dir, "init", "neutral"]);
    const configPath = path.join(dir, "recontent.config.ts");
    writeFileSync(configPath, "// stale\n");

    const result = runCli(["--cwd", dir, "init", "neutral", "--force"]);
    expect(result.status).toBe(0);
    expect(readFileSync(configPath, "utf-8")).toContain("defineConfig(");
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

describe("recontent init --from", () => {
  const resolver = "fixture.resolver.json";

  function initFromFixture(prefix: string, extraArgs: string[] = []) {
    const dir = makeScratchDir(prefix);
    copyFixture("dtcg", dir);
    const result = runCli(["--cwd", dir, "init", "--from", resolver, ...extraArgs]);
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
    const result = runCli(["--cwd", dir, "init", "--from", resolver, "neutral"]);

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
      "--from",
      "primitives.tokens.json",
      "--from",
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

    const result = runCli(["--cwd", dir, "init", "--from", resolver]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("--force");
    expect(readFileSync(configPath, "utf-8")).toBe("// mine\n");

    expect(runCli(["--cwd", dir, "init", "--from", resolver, "--force"]).status).toBe(0);
    expect(readFileSync(configPath, "utf-8")).toContain("defineConfig(");
  });

  test("fails with a clear error for a missing source", () => {
    const dir = makeScratchDir("init-from-missing");
    const result = runCli(["--cwd", dir, "init", "--from", "nope.resolver.json"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("does not exist");
    expect(existsSync(path.join(dir, "recontent.config.ts"))).toBe(false);
  });

  describe("round trip through the dtcg plugin", () => {
    type Tokens = Record<string, unknown>;

    function normalize(value: unknown, key?: string): unknown {
      if (key === "fontFamily") {
        const families = Array.isArray(value) ? value : String(value).split(",");
        return families.map((family) =>
          String(family)
            .trim()
            .replace(/^['"]|['"]$/g, ""),
        );
      }
      if (key === "fontWeight" && typeof value === "string") {
        return FONT_WEIGHT_NUMERIC[value as keyof typeof FONT_WEIGHT_NUMERIC] ?? value;
      }
      if (key === "letterSpacing" && value === 0) return { value: 0, unit: "px" };
      if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)) {
        const [r, g, b] = [1, 3, 5].map(
          (index) => parseInt(value.slice(index, index + 2), 16) / 255,
        );
        return { colorSpace: "srgb", components: [r, g, b], alpha: 1 };
      }
      if (typeof value === "string") {
        const match = /^(-?\d*\.?\d+)(px|rem|em|ms|s)$/.exec(value);
        // The dtcg plugin emits em as rem, the only relative unit DTCG defines.
        return match
          ? { value: Number(match[1]), unit: match[2] === "em" ? "rem" : match[2] }
          : value;
      }
      if (Array.isArray(value)) return value.map((item) => normalize(item));
      if (!isObject(value)) return value;
      if (typeof value.value === "number" && value.unit === "em") return { ...value, unit: "rem" };
      if ("colorSpace" in value) {
        return {
          colorSpace: value.colorSpace,
          components: value.components,
          alpha: value.alpha ?? 1,
        };
      }
      return Object.fromEntries(
        Object.entries(value)
          .filter(
            ([name]) =>
              name !== "WebkitFontSmoothing" && (name !== "inset" || value[name] === true),
          )
          .map(([name, item]) => [name, normalize(item, name)]),
      );
    }

    function resolveSource(tokens: TokenMap, value: unknown): unknown {
      const reference = aliasTarget(value);
      if (reference !== undefined)
        return resolveSource(tokens, lookupToken(tokens, reference)!.value);
      if (Array.isArray(value)) return value.map((item) => resolveSource(tokens, item));
      if (isObject(value)) {
        return Object.fromEntries(
          Object.entries(value).map(([name, item]) => [name, resolveSource(tokens, item)]),
        );
      }
      return value;
    }

    function outputNode(doc: Tokens, layerPath: string[]): { $value?: unknown } | undefined {
      let node: unknown = doc;
      for (const segment of layerPath) node = isObject(node) ? node[segment] : undefined;
      return isObject(node) && "$value" in node ? node : undefined;
    }

    function resolveOutput(doc: Tokens, value: unknown): unknown {
      const reference = aliasTarget(value);
      if (reference !== undefined) {
        return resolveOutput(doc, outputNode(doc, reference.split("."))!.$value);
      }
      if (Array.isArray(value)) return value.map((item) => resolveOutput(doc, item));
      if (isObject(value)) {
        return Object.fromEntries(
          Object.entries(value).map(([name, item]) => [name, resolveOutput(doc, item)]),
        );
      }
      return value;
    }

    /** Compares every source token present in `doc` with its resolved output value. */
    function compare(source: TokenMap, doc: Tokens): number {
      let compared = 0;
      for (const token of source.values()) {
        const node =
          outputNode(doc, ["ref", ...token.path]) ?? outputNode(doc, ["system", ...token.path]);
        if (!node) continue;
        const key =
          token.type === "fontFamily" || token.type === "fontWeight" ? token.type : undefined;
        expect({
          path: token.path,
          value: normalize(resolveOutput(doc, node.$value), key),
        }).toEqual({
          path: token.path,
          value: normalize(resolveSource(source, token.value), key),
        });
        compared += 1;
      }
      return compared;
    }

    test("keeps the resolved values of every supported token, in every theme", () => {
      const { dir } = initFromFixture("init-from-roundtrip");
      const generated = path.join(dir, "recontent.config.ts");
      const withPlugin = readFileSync(generated, "utf-8")
        .replace(/^import \{/m, 'import { dtcg } from "recontent/plugins";\nimport {')
        .replace(/\n\}\);\n$/, '\n  plugins: [dtcg({ outDir: "out" })],\n});\n');
      writeFileSync(path.join(dir, "build.config.ts"), withPlugin);
      expect(runCli(["--cwd", dir, "build", "-c", "build.config.ts"]).status).toBe(0);
      const read = (name: string) =>
        JSON.parse(readFileSync(path.join(dir, "out", name), "utf-8")) as Tokens;

      const loaded = loadSources([resolver], dir, () => {});
      const base = flattenDocument(loaded.base, () => {});
      expect(compare(base, read("tokens.tokens.json"))).toBe(30);

      for (const { modifier, context, doc } of loaded.contexts) {
        const effective: TokenMap = new Map(base);
        for (const [key, token] of flattenDocument(doc, () => {})) {
          effective.set(key, { ...token, type: token.type ?? base.get(key)?.type });
        }
        const name = `${modifier}-${context}`;
        // theme.extra only exists in dark and is reported as skipped.
        expect(compare(effective, read(`${name}.tokens.json`))).toBe(30);
      }
    });
  });
});

describe("recontent build", () => {
  test("aborts without writing output when an alias is broken", () => {
    const dir = makeScratchDir("build-broken-alias");
    copyFixture("broken-alias", dir);

    const result = runCli(["--cwd", dir, "build"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Broken alias");
    expect(existsSync(path.join(dir, "dist/tokens.css"))).toBe(false);
  });

  test("reports each error once, then closes with a count summary", () => {
    const dir = makeScratchDir("build-summary");
    copyFixture("broken-alias", dir);

    const lines = runCli(["--cwd", dir, "build"]).stderr.trim().split("\n");

    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^error: Broken alias/);
    expect(lines[1]).toBe("error: build failed: 1 error, 0 warnings");
  });

  test("lists written files relative to --cwd and summarizes them", () => {
    const dir = makeScratchDir("build-wrote");
    copyFixture("valid", dir);

    const { stderr } = runCli(["--cwd", dir, "build"]);

    expect(stderr).toContain("Wrote dist/tokens.css\n");
    expect(stderr).not.toContain(dir);
    expect(stderr).toMatch(/Wrote \d+ files\n$/);
  });

  test("warns, and still exits 0, when the config has no plugins", () => {
    const dir = makeScratchDir("build-no-plugins");
    expect(runCli(["--cwd", dir, "init", "neutral"]).status).toBe(0);

    const result = runCli(["--cwd", dir, "build"]);

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("warning: No plugins configured in recontent.config.ts");
  });

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

  test("runs the configured dtcg and docs plugins", () => {
    const dir = makeScratchDir("build-dtcg-docs");
    copyFixture("valid", dir);

    const result = runCli(["--cwd", dir, "build"]);

    expect(result.status).toBe(0);

    const htmlPath = path.join(dir, "dist/design.html");
    expect(existsSync(htmlPath)).toBe(true);
    const html = readFileSync(htmlPath, "utf-8");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("system.color.accent");

    const mdPath = path.join(dir, "dist/design.md");
    expect(existsSync(mdPath)).toBe(true);
    const md = readFileSync(mdPath, "utf-8");
    expect(md).toContain("system.color.accent");
    expect(md).toContain("Primary accent color.");

    const dtcgPath = path.join(dir, "dist/tokens.tokens.json");
    expect(existsSync(dtcgPath)).toBe(true);
    const json = JSON.parse(readFileSync(dtcgPath, "utf-8"));
    expect(json.ref.color.brand.primary.$value.hex).toBe("#2563eb");
    // `system.color.accent` aliases `ref.color.brand.primary` — DTCG
    // represents that as a `{...}` reference rather than a resolved value.
    expect(json.system.color.accent.$value).toBe("{ref.color.brand.primary}");
  });

  test("a missing -c file is reported as such, without a stale default-name hint", () => {
    const dir = makeScratchDir("build-missing-explicit");
    const result = runCli(["--cwd", dir, "build", "-c", "other.config.ts"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Config file not found");
    expect(result.stderr).toContain("other.config.ts");
    expect(result.stderr).not.toContain("Make sure");
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

  test("fails with a non-zero exit code when the config file is missing", () => {
    const dir = makeScratchDir("build-missing-config");

    const result = runCli(["--cwd", dir, "build"]);

    expect(result.status).not.toBe(0);
    expect(result.stderr.toLowerCase()).toContain("recontent.config");
  });
});

describe("recontent diff", () => {
  function git(args: string[], cwd: string): void {
    const result = spawnSync("git", args, { cwd, encoding: "utf-8" });
    if (result.status !== 0) {
      throw new Error(`git ${args.join(" ")} failed: ${result.stdout}`);
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

  test("names the compared revision when nothing changed", () => {
    const dir = makeScratchDir("diff-none-rev");
    copyFixture("valid", dir);
    initRepoWithCommit(dir);
    git(["tag", "v1"], dir);

    expect(runCli(["--cwd", dir, "diff", "v1"]).stdout).toContain("and v1.");
  });

  test("says there are no commits yet in a fresh repository", () => {
    const dir = makeScratchDir("diff-no-commits");
    copyFixture("valid", dir);
    git(["init", "-q"], dir);

    const result = runCli(["--cwd", dir, "diff"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("No commits yet");
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

  test("--format json prints the diff as JSON on stdout", () => {
    const dir = makeScratchDir("diff-json");
    copyFixture("valid", dir);
    initRepoWithCommit(dir);

    const configPath = path.join(dir, "recontent.config.ts");
    const original = readFileSync(configPath, "utf-8");
    writeFileSync(configPath, original.replace("#2563eb", "#ff0000"));

    const result = runCli(["--cwd", dir, "diff", "--format", "json"]);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    const parsed = JSON.parse(result.stdout);
    expect(parsed.config).toBe("recontent.config.ts");
    expect(parsed.rev).toBe("HEAD");
    expect(parsed.breaking).toBe(false);
    expect(parsed.counts.changed).toBe(1);
    expect(parsed.changed).toHaveLength(1);
    expect(parsed.changed[0].to.path.join(".")).toBe("ref.color.brand.primary");
  });

  test("rejects an unknown --format with a usage error", () => {
    const dir = makeScratchDir("diff-bad-format");
    copyFixture("valid", dir);
    initRepoWithCommit(dir);

    const result = runCli(["--cwd", dir, "diff", "--format", "yaml"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("markdown");
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
    expect(withBreaking.stderr).toContain("error: 2 breaking changes found");
  });
});
