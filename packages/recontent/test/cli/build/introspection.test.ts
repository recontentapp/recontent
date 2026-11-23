import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { describe, expect, test } from "@jest/globals";
import { copyFixture, makeScratchDir, runCli, useCliScratch } from "../../helpers/cli.js";

useCliScratch();

describe("recontent build with introspection", () => {
  const configWith = (
    introspection: string,
    plugins: string,
  ) => `import { defineConfig, defineReferenceTokens, defineSystemTokens, defineComponentTokens, tokens } from "recontent";
import { css, designMD, docs } from "recontent/plugins";

const ref = defineReferenceTokens({ color: { white: tokens.color("#ffffff") } });
const system = defineSystemTokens({ color: { surface: ref.color.white } });

export default defineConfig({
  tokens: { ref, system, components: defineComponentTokens({}) },
  ${introspection}
  plugins: [${plugins}],
});
`;

  function buildProject(prefix: string, config?: string): string {
    const dir = makeScratchDir(prefix);
    copyFixture("inspect", dir);
    if (config) writeFileSync(path.join(dir, "recontent.config.ts"), config);
    return dir;
  }

  test("the docs plugins get component APIs, and the output holds no repository state", () => {
    const dir = buildProject("build-introspection");
    const result = runCli(["--cwd", dir, "build"]);

    expect(result.status).toBe(0);
    const html = readFileSync(path.join(dir, "docs/design.html"), "utf-8");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("system.color.accent");

    const markdown = readFileSync(path.join(dir, "docs/DESIGN.md"), "utf-8");
    expect(markdown).toMatch(/^---\nversion: alpha\n/);
    expect(markdown).toContain('system-color-accent: "{colors.ref-color-brand-primary}"');
    expect(markdown).toContain("- `system-color-accent`: Primary accent color.");
    expect(markdown).toContain("## Components");
    expect(markdown).toContain("- **Button**: Triggers an action.");
    expect(markdown).toContain("recontent inspect components <Name>");
    expect(markdown).toContain(
      "- Don't use `{colors.system-color-legacy}`: Use system.color.accent.",
    );
    expect(markdown).toContain("- Don't use `Legacy`: Use \\`Button\\`");
    expect(markdown).not.toContain("Source:");
    expect(markdown).not.toContain("Generated from");
  });

  test("a config with introspection but no tokens builds the docs", () => {
    const dir = buildProject(
      "build-introspection-only",
      `import { defineConfig } from "recontent";
import { designMD } from "recontent/plugins";

export default defineConfig({
  introspection: { entry: "src/index.ts", importPath: "@acme/ui" },
  plugins: [designMD({ outDir: "docs" })],
});
`,
    );

    const result = runCli(["--cwd", dir, "build"]);
    expect(result.status).toBe(0);
    expect(readFileSync(path.join(dir, "docs/DESIGN.md"), "utf-8")).toContain(
      "- **Button**: Triggers an action.",
    );
  });

  describe("introspection happens only for plugins that consume components", () => {
    const broken = 'introspection: { entry: "src/does-not-exist.ts", importPath: "@acme/ui" },';

    test("token-only plugins never trigger it, so a broken entry is harmless", () => {
      const dir = buildProject("build-lazy", configWith(broken, 'css({ outDir: "out" })'));
      const result = runCli(["--cwd", dir, "build"]);

      expect(result.status).toBe(0);
      expect(existsSync(path.join(dir, "out/tokens.css"))).toBe(true);
    });

    test("a failure fails the plugin that depends on components, not the others", () => {
      const dir = buildProject(
        "build-partial",
        configWith(broken, 'css({ outDir: "out" }), docs({ outDir: "docs" })'),
      );
      const result = runCli(["--cwd", dir, "build"]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("error: [recontent:docs]");
      expect(result.stderr).toContain("does-not-exist.ts");
      expect(result.stderr).toContain("build failed: 1 error");
      expect(existsSync(path.join(dir, "out/tokens.css"))).toBe(true);
      expect(existsSync(path.join(dir, "docs/design.html"))).toBe(false);
    });

    test("designMD() works without introspection, just without components", () => {
      const dir = buildProject("build-no-block", configWith("", 'designMD({ outDir: "docs" })'));
      const result = runCli(["--cwd", dir, "build"]);

      expect(result.status).toBe(0);
      const markdown = readFileSync(path.join(dir, "docs/DESIGN.md"), "utf-8");
      expect(markdown).toContain("system-color-surface");
      expect(markdown).not.toContain("## Components");
    });
  });

  describe("the introspection cache", () => {
    const cached = (result: { stderr: string }) => result.stderr.includes("reused the cache");
    const debug = (dir: string, ...args: string[]) =>
      runCli(["--cwd", dir, "--log-level", "debug", ...args]);
    const cacheFiles = (dir: string) =>
      existsSync(path.join(dir, ".recontent"))
        ? readdirSync(path.join(dir, ".recontent")).filter((name) => /^cache-\w+\.json$/.test(name))
        : [];

    test("a second build reuses it, and so does inspect", () => {
      const dir = buildProject("cache-reuse");

      expect(cached(debug(dir, "build"))).toBe(false);
      expect(cacheFiles(dir)).toHaveLength(1);
      expect(readFileSync(path.join(dir, ".recontent/.gitignore"), "utf-8")).toBe("*\n");
      expect(cached(debug(dir, "build"))).toBe(true);
      expect(cached(debug(dir, "inspect", "components"))).toBe(true);
    });

    test("it is invalidated when a source file changes", () => {
      const dir = buildProject("cache-invalidate");
      runCli(["--cwd", dir, "build"]);

      const file = path.join(dir, "src/button.tsx");
      writeFileSync(file, readFileSync(file, "utf-8").replace("label", "caption"));

      const result = debug(dir, "inspect", "components", "Button", "--format", "json");
      expect(cached(result)).toBe(false);
      expect(JSON.parse(result.stdout).components[0].props.map((p: any) => p.name)).toContain(
        "caption",
      );
    });

    test("it is invalidated when a file an @example points to changes", () => {
      const dir = buildProject("cache-example-file");
      const source = path.join(dir, "src/button.tsx");
      writeFileSync(
        source,
        readFileSync(source, "utf-8").replace(
          ' * <Button label="Save" />',
          " * ./button.example.tsx",
        ),
      );
      const example = path.join(dir, "src/button.example.tsx");
      writeFileSync(example, '<Button label="Save" />\n');
      runCli(["--cwd", dir, "build"]);
      expect(cached(debug(dir, "inspect", "components"))).toBe(true);

      writeFileSync(example, '<Button label="Saved" />\n');

      const result = debug(dir, "inspect", "components", "Button", "--format", "json");
      expect(cached(result)).toBe(false);
      expect(JSON.parse(result.stdout).components[0].examples).toEqual([
        { title: "Basic", code: '<Button label="Saved" />' },
      ]);
    });

    test("--no-cache neither reads nor writes it", () => {
      const dir = buildProject("cache-off");

      expect(runCli(["--cwd", dir, "build", "--no-cache"]).status).toBe(0);
      expect(existsSync(path.join(dir, ".recontent"))).toBe(false);

      runCli(["--cwd", dir, "build"]);
      expect(cached(debug(dir, "build", "--no-cache"))).toBe(false);
      expect(cached(debug(dir, "inspect", "components", "--no-cache"))).toBe(false);
    });

    test("a new file next to the project's own files is a miss", () => {
      const dir = buildProject("cache-new-file");
      runCli(["--cwd", dir, "build"]);
      expect(cached(debug(dir, "inspect", "components"))).toBe(true);

      writeFileSync(path.join(dir, "src/unrelated.ts"), "export {};\n");

      expect(cached(debug(dir, "inspect", "components"))).toBe(false);
    });

    test("it keeps a .gitignore it did not write, and does not follow a symlink in its place", () => {
      const kept = buildProject("cache-gitignore");
      mkdirSync(path.join(kept, ".recontent"));
      writeFileSync(path.join(kept, ".recontent/.gitignore"), "cache-*.json\n");
      runCli(["--cwd", kept, "build"]);
      expect(readFileSync(path.join(kept, ".recontent/.gitignore"), "utf-8")).toBe(
        "cache-*.json\n",
      );

      const linked = buildProject("cache-symlink");
      const target = path.join(linked, "precious.txt");
      writeFileSync(target, "keep me\n");
      mkdirSync(path.join(linked, ".recontent"));
      symlinkSync(target, path.join(linked, ".recontent/.gitignore"));
      expect(runCli(["--cwd", linked, "build"]).status).toBe(0);
      expect(readFileSync(target, "utf-8")).toBe("keep me\n");
    });

    test("two configs in one directory each keep their own cache", () => {
      const dir = buildProject("cache-two-configs");
      copyFileSync(path.join(dir, "recontent.config.ts"), path.join(dir, "other.config.ts"));
      const run = (config: string) => debug(dir, "--config", config, "inspect", "components");

      run("recontent.config.ts");
      run("other.config.ts");

      expect(cacheFiles(dir)).toHaveLength(2);
      expect(cached(run("recontent.config.ts"))).toBe(true);
      expect(cached(run("other.config.ts"))).toBe(true);
    });

    test("a corrupt cache is a miss, not an error", () => {
      const dir = buildProject("cache-corrupt");
      runCli(["--cwd", dir, "build"]);
      writeFileSync(path.join(dir, ".recontent", cacheFiles(dir)[0]!), "{ not json");

      const result = debug(dir, "inspect", "components");
      expect(result.status).toBe(0);
      expect(cached(result)).toBe(false);
    });
  });
});
