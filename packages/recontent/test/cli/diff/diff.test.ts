import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "@jest/globals";
import {
  copyFixture,
  linkReactTypes,
  makeScratchDir,
  runCli,
  useCliScratch,
} from "../../helpers/cli.js";
import { commitAll, git } from "../../helpers/git.js";

useCliScratch();

describe("recontent diff", () => {
  function initRepoWithCommit(dir: string): void {
    git(dir, "init", "-q");
    commitAll(dir);
  }

  test("reports no changes when nothing differs from HEAD", () => {
    const dir = makeScratchDir("diff-none");
    copyFixture("valid", dir);
    initRepoWithCommit(dir);

    const result = runCli(["--cwd", dir, "diff"]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("No changes between the working tree and HEAD");
  });

  test("names the compared revision when nothing changed", () => {
    const dir = makeScratchDir("diff-none-rev");
    copyFixture("valid", dir);
    initRepoWithCommit(dir);
    git(dir, "tag", "v1");

    expect(runCli(["--cwd", dir, "diff", "v1"]).stdout).toContain("and v1.");
  });

  test("says there are no commits yet in a fresh repository", () => {
    const dir = makeScratchDir("diff-no-commits");
    copyFixture("valid", dir);
    git(dir, "init", "-q");

    const result = runCli(["--cwd", dir, "diff"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("No commits yet");
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
    expect(parsed.kind).toBe("diff");
    expect(typeof parsed.schemaVersion).toBe("string");
    expect(parsed.config).toBe("recontent.config.ts");
    expect(parsed.rev).toBe("HEAD");
    expect(parsed.breaking).toBe(false);
    expect(parsed.counts.tokens.changed).toBe(1);
    expect(parsed.tokens.changed).toHaveLength(1);
    expect(parsed.tokens.changed[0].to.path.join(".")).toBe("ref.color.brand.primary");
    expect(parsed.components).toBeUndefined();
  });

  test("--format json with an invalid revision prints an error document on stdout", () => {
    const dir = makeScratchDir("diff-json-bad-rev");
    copyFixture("valid", dir);
    initRepoWithCommit(dir);

    const result = runCli(["--cwd", dir, "diff", "nope", "--format", "json"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("error:");
    const parsed = JSON.parse(result.stdout);
    expect(parsed.kind).toBe("error");
    expect(typeof parsed.schemaVersion).toBe("string");
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.errors[0].message).toContain("nope");
  });

  test("fails on a broken alias in the working tree, like build and inspect", () => {
    const dir = makeScratchDir("diff-broken-alias");
    copyFixture("broken-alias", dir);
    initRepoWithCommit(dir);

    const result = runCli(["--cwd", dir, "diff"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Broken alias");
    expect(result.stdout).toBe("");
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

  test("reports a deprecated token, without calling it breaking", () => {
    const dir = makeScratchDir("diff-deprecated");
    copyFixture("valid", dir);
    initRepoWithCommit(dir);

    const configPath = path.join(dir, "recontent.config.ts");
    writeFileSync(
      configPath,
      readFileSync(configPath, "utf-8").replace(
        'tokens.color("#2563eb")',
        'tokens.color("#2563eb").deprecate("Use something else.")',
      ),
    );

    const result = runCli(["--cwd", dir, "diff", "--fail-on-breaking"]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("## Metadata (2)");
    expect(result.stdout).toContain(
      "`ref.color.brand.primary`: now deprecated: Use something else.",
    );
  });

  describe("components", () => {
    function introspectedRepo(prefix: string): string {
      const dir = makeScratchDir(prefix);
      copyFixture("inspect", dir);
      linkReactTypes(dir);
      writeFileSync(path.join(dir, ".gitignore"), "node_modules/\n.recontent/\ndocs/\n");
      return dir;
    }

    function editButton(dir: string): void {
      const file = path.join(dir, "src/button.tsx");
      writeFileSync(
        file,
        readFileSync(file, "utf-8")
          .replace('"solid" | "outline"', '"solid"')
          .replace("  icon?: IconName;\n", ""),
      );
    }

    test("reports API changes to components and the types they use", () => {
      const dir = introspectedRepo("diff-components");
      initRepoWithCommit(dir);
      editButton(dir);

      const result = runCli(["--cwd", dir, "diff"]);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("# Components\n\n## Breaking (2)");
      expect(result.stdout).toContain(
        '- `Button`\n  - **prop** `variant`: removed value `"outline"`\n  - **removed prop** `icon`',
      );
      expect(result.stdout).not.toContain("# Tokens");
    });

    test("--format json nests tokens, components and types with their counts", () => {
      const dir = introspectedRepo("diff-components-json");
      initRepoWithCommit(dir);
      editButton(dir);
      const file = path.join(dir, "src/button.tsx");
      writeFileSync(file, readFileSync(file, "utf-8").replace('"sm" | "md"', '"sm"'));

      const result = runCli(["--cwd", dir, "diff", "--format", "json"]);

      expect(result.status).toBe(0);
      const parsed = JSON.parse(result.stdout);
      expect(parsed.breaking).toBe(true);
      // Dropping `icon` leaves `IconName` unused, so it leaves the introspected types too.
      expect(parsed.counts.components).toEqual({ added: 0, removed: 0, changed: 1, breaking: 3 });
      // `ButtonSize` is an alias of `IconSize`, so both lose the value.
      expect(parsed.counts.types).toEqual({ added: 0, removed: 1, changed: 2, breaking: 3 });
      expect(parsed.counts.breaking).toBe(6);
      expect(parsed.components.changed[0].name).toBe("Button");
      expect(parsed.types.changed.map((type: { name: string }) => type.name)).toEqual([
        "ButtonSize",
        "IconSize",
      ]);
    });

    test("--fail-on-breaking exits 1 on a breaking component change only", () => {
      const dir = introspectedRepo("diff-components-fail");
      initRepoWithCommit(dir);
      const file = path.join(dir, "src/button.tsx");
      writeFileSync(
        file,
        readFileSync(file, "utf-8").replace(
          "  size?: ButtonSize;",
          "  size?: ButtonSize;\n  tone?: string;",
        ),
      );

      expect(runCli(["--cwd", dir, "diff", "--fail-on-breaking"]).status).toBe(0);

      editButton(dir);
      const result = runCli(["--cwd", dir, "diff", "--fail-on-breaking"]);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("error: 3 breaking changes found");
    });

    test("--fail-on-breaking exits 1 when introspection is removed", () => {
      const dir = introspectedRepo("diff-components-head-without");
      initRepoWithCommit(dir);
      const configPath = path.join(dir, "recontent.config.ts");
      writeFileSync(
        configPath,
        readFileSync(configPath, "utf-8").replace(/ {2}introspection: \{.*\},\n/, ""),
      );

      const result = runCli(["--cwd", dir, "diff", "--fail-on-breaking"]);

      expect(result.status).toBe(1);
      expect(result.stdout).toContain("**removed**");
    });

    test("skips components, with a note, when the revision has no introspection", () => {
      const dir = introspectedRepo("diff-components-base-without");
      const configPath = path.join(dir, "recontent.config.ts");
      const config = readFileSync(configPath, "utf-8");
      writeFileSync(configPath, config.replace(/ {2}introspection: \{.*\},\n/, ""));
      initRepoWithCommit(dir);
      writeFileSync(configPath, config);

      const result = runCli(["--cwd", dir, "diff"]);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("No changes between the working tree and HEAD.");
      expect(result.stdout).toContain("Components were not compared: HEAD has no introspection");
    });
  });
});
