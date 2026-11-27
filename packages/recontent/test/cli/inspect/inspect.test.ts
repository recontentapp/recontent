import { appendFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "@jest/globals";
import { copyFixture, makeScratchDir, runCli, useCliScratch } from "../../helpers/cli.js";

useCliScratch();

describe("recontent inspect", () => {
  function inspectProject(prefix = "inspect"): string {
    const dir = makeScratchDir(prefix);
    copyFixture("inspect", dir);
    return dir;
  }

  describe("for humans and agents (markdown)", () => {
    test("the overview lists counts, themes, components and types, and ends with a Next hint", () => {
      const result = runCli(["--cwd", inspectProject(), "inspect"]);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("# Overview");
      expect(result.stdout).toMatch(/\| ref \| 3 \|/);
      expect(result.stdout).toMatch(/\| system \| 4 \|/);
      expect(result.stdout).toContain("Themes: `dark`");
      expect(result.stdout).toContain("`Button`, `Legacy`");
      expect(result.stdout).toContain("## Types (3)");
      expect(result.stdout).toContain("`ButtonSize`, `IconName`, `IconSize`");
      expect(result.stdout.trimEnd().split("\n").at(-1)).toMatch(
        /^Next: `recontent inspect tokens system/,
      );
    });

    test("tokens without a path lists groups, not individual tokens", () => {
      const result = runCli(["--cwd", inspectProject(), "inspect", "tokens"]);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("| `system.color` | system | 3 |");
      expect(result.stdout).not.toContain("system.color.accent");
      expect(result.stdout).toContain("Next: `recontent inspect tokens system");
    });

    test("tokens with a path lists the subtree with CSS variables and theme values", () => {
      const result = runCli(["--cwd", inspectProject(), "inspect", "tokens", "system.color"]);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("| Token | Type | Value | dark | CSS variable | Notes |");
      expect(result.stdout).toContain("`system.color.accent`");
      expect(result.stdout).toContain("var(--system-color-accent)");
      expect(result.stdout).toContain("`#60a5fa`");
      expect(result.stdout).toContain("**Deprecated**: Use system.color.accent.");
      expect(result.stdout).not.toContain("system.spacing");
    });

    test("search finds tokens, components and types together, and any query may match", () => {
      const result = runCli(["--cwd", inspectProject(), "inspect", "search", "#2563eb", "action"]);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("`system.color.accent`");
      expect(result.stdout).toContain("`Button`");
      expect(result.stdout).toContain("Next: `recontent inspect components");
    });

    test("--type and --deprecated narrow the tokens", () => {
      const dir = inspectProject();

      const dimension = runCli(["--cwd", dir, "inspect", "tokens", "--type", "dimension"]);
      expect(dimension.stdout).toContain("system.spacing.sm");
      expect(dimension.stdout).not.toContain("system.color");

      const deprecated = runCli(["--cwd", dir, "inspect", "tokens", "--deprecated"]);
      expect(deprecated.stdout).toContain("system.color.legacy");
      expect(deprecated.stdout).not.toContain("system.color.surface");
    });

    test("components lists one line each; a name shows the props table", () => {
      const dir = inspectProject();

      const list = runCli(["--cwd", dir, "inspect", "components"]);
      expect(list.status).toBe(0);
      expect(list.stdout).toContain("- `Button` (4 props) — Triggers an action.");
      expect(list.stdout).toContain("- `Legacy` (1 prop, deprecated → Button, experimental)");
      // Categorised components first, under their category; the others last.
      expect(list.stdout.indexOf("## Actions")).toBeLessThan(list.stdout.indexOf("- `Button`"));
      expect(list.stdout.indexOf("- `Button`")).toBeLessThan(list.stdout.indexOf("- `Legacy`"));
      expect(list.stdout).toContain("Next: `recontent inspect components Button`");

      const detail = runCli(["--cwd", dir, "inspect", "components", "Button"]);
      expect(detail.status).toBe(0);
      expect(detail.stdout).toContain("## Button");
      expect(detail.stdout).toMatch(/Source: \[?`src\/button\.tsx:\d+`/);
      expect(detail.stdout).toContain('| `variant` | `"solid" \\| "outline"` | `"solid"` | no |');
      expect(detail.stdout).toContain("| `label` | `string` | — | yes |");
      expect(detail.stdout).toContain("Also accepts: `ButtonHTMLAttributes`");
      expect(detail.stdout).not.toContain("## Legacy");
      // Fenced, so that headings in the usage can't break the hierarchy.
      expect(detail.stdout).toContain(
        "### Usage\n\n```md\nPrefer it over a link when the click changes something.\n```",
      );
      expect(detail.stdout).toContain("### Stories\n\n- `src/button.stories.tsx`");
      expect(detail.stdout).toContain(
        '### Examples\n\n**Basic**\n\n```tsx\n<Button label="Save" />\n```',
      );
    });

    test("warnings are limited to the selected components, plus the project-wide ones", () => {
      const dir = inspectProject();
      writeFileSync(
        path.join(dir, "src/warned.tsx"),
        "/** @link javascript:alert(1) */\nexport function Warned() {\n  return <span />;\n}\n",
      );
      appendFileSync(path.join(dir, "src/index.ts"), 'export { Warned } from "./warned";\n');
      const warning = "warning: Warned: @link javascript:alert(1) is not an http(s) URL.";

      expect(runCli(["--cwd", dir, "inspect", "components", "Button"]).stderr).not.toContain(
        warning,
      );
      expect(runCli(["--cwd", dir, "inspect", "components", "Warned"]).stderr).toContain(warning);
      // Cached from here on, and still attributed.
      expect(runCli(["--cwd", dir, "inspect", "components"]).stderr).toContain(warning);
      expect(runCli(["--cwd", dir, "inspect", "types"]).stderr).not.toContain(warning);
      expect(runCli(["--cwd", dir, "inspect"]).stderr).toContain(warning);
    });

    test("a deprecated component says what replaces it, and links to it", () => {
      const dir = inspectProject();

      const detail = runCli(["--cwd", dir, "inspect", "components", "Legacy"]);
      expect(detail.stdout).toContain("> ⚠️ Deprecated: Use \\`Button\\` instead.");
      expect(detail.stdout).toContain("Replaced by: `Button`");
      expect(detail.stdout).toContain("> 🧪 Experimental");
    });

    test("components shows the import and the props, with the types they mention listed after", () => {
      const detail = runCli(["--cwd", inspectProject(), "inspect", "components", "Button"]);

      expect(detail.status).toBe(0);
      const output = detail.stdout;
      expect(output).toContain('Import: `import { Button } from "@acme/ui"`');
      expect(output.indexOf("Import:")).toBeLessThan(output.indexOf("Source:"));
      // Literal unions are in the table already, so the types are only named.
      expect(output).toContain('`"home" \\| "search"`');
      expect(output).not.toContain("## Types");
      expect(output).toContain("More types: `IconName`, `ButtonSize`, `IconSize`");
      expect(output).toContain("--props icon");
    });

    test("components --props shows only those props, and what they reference", () => {
      const dir = inspectProject();
      const detail = runCli(["--cwd", dir, "inspect", "components", "Button", "--props", "icon"]);

      expect(detail.status).toBe(0);
      expect(detail.stdout).toContain("| `icon` |");
      expect(detail.stdout).not.toContain("| `label` |");
      expect(detail.stdout).not.toContain("Also accepts");
      expect(detail.stdout).toContain("More types: `IconName`");
      expect(detail.stdout).not.toContain("ButtonSize");

      // An inherited prop is a row naming where it comes from.
      const inherited = runCli(["--cwd", dir, "inspect", "components", "Button", "--props", "id"]);
      expect(inherited.stdout).toContain("| `id` | `ButtonHTMLAttributes (@types/react)` |");

      const json = runCli([
        "--cwd",
        dir,
        "inspect",
        "components",
        "Button",
        "--props",
        "icon",
        "--format",
        "json",
      ]);
      expect(
        JSON.parse(json.stdout).components[0].props.map((p: { name: string }) => p.name),
      ).toEqual(["icon"]);
    });

    test("components --props with an unknown prop exits 2 and suggests", () => {
      const result = runCli([
        "--cwd",
        inspectProject(),
        "inspect",
        "components",
        "Button",
        "--props",
        "icn",
      ]);
      expect(result.status).toBe(2);
      expect(result.stderr).toContain('No prop matches "icn". Did you mean `icon`');
    });

    test("types lists one line each; a name shows it with what it references", () => {
      const dir = inspectProject();
      const list = runCli(["--cwd", dir, "inspect", "types"]);
      expect(list.status).toBe(0);
      expect(list.stdout).toContain("- `IconName` (type, 2 values) — Names an icon of the set.");
      expect(list.stdout).toContain("Next: `recontent inspect types ButtonSize`");

      const detail = runCli(["--cwd", dir, "inspect", "types", "ButtonSize"]);
      expect(detail.status).toBe(0);
      expect(detail.stdout).toContain("### ButtonSize");
      expect(detail.stdout).toContain("### IconSize");
      expect(detail.stdout).not.toContain("### IconName");
    });
  });

  describe("for scripts (json)", () => {
    function json(args: string[], dir: string) {
      const result = runCli(["--cwd", dir, "inspect", ...args, "--format", "json"]);
      return { ...result, data: JSON.parse(result.stdout) as Record<string, any> };
    }

    test("documentation tags come with the components", () => {
      const dir = inspectProject();
      const [legacy] = json(["components", "Legacy"], dir).data.components;
      expect(legacy).toMatchObject({
        replacement: "Button",
        links: ["Button"],
        experimental: true,
      });
      const [button] = json(["components", "Button"], dir).data.components;
      expect(button).toMatchObject({
        category: "Actions",
        usage: "Prefer it over a link when the click changes something.",
        examples: [{ title: "Basic", code: '<Button label="Save" />' }],
        stories: ["src/button.stories.tsx"],
      });
    });

    test("every form parses, is versioned and kind-tagged, and returns full detail", () => {
      const dir = inspectProject();

      const overview = json([], dir);
      expect(overview.status).toBe(0);
      expect(overview.data).toMatchObject({
        schemaVersion: "2",
        kind: "overview",
        themes: [{ name: "theme", default: "default", contexts: ["dark"] }],
        components: ["Button", "Legacy"],
      });
      expect(overview.data.tokens.total).toBe(7);

      const tokens = json(["tokens"], dir);
      expect(tokens.data).toMatchObject({ schemaVersion: "2", kind: "tokens" });
      expect(tokens.data.tokens).toHaveLength(7);
      expect(tokens.data.tokens[0]).toHaveProperty("cssVar");
      expect(
        tokens.data.tokens.find((t: any) => t.path === "ref.color.brand.primary").values,
      ).toEqual({
        default: "#2563eb",
        dark: "#60a5fa",
      });

      const components = json(["components"], dir);
      expect(components.data).toMatchObject({ schemaVersion: "2", kind: "components" });
      expect(components.data.components.map((c: any) => c.name)).toEqual(["Button", "Legacy"]);
      expect(components.data.components[0].props.map((p: any) => p.name)).toEqual([
        "icon",
        "label",
        "size",
        "variant",
      ]);
      expect(components.data.components[0].references).toEqual(["ButtonSize", "IconName"]);
      expect(components.data.types.map((t: any) => t.id)).toEqual([
        "ButtonSize",
        "IconName",
        "IconSize",
      ]);

      const types = json(["types"], dir);
      expect(types.status).toBe(0);
      expect(types.data).toMatchObject({ schemaVersion: "2", kind: "types" });
      expect(types.data.types.map((t: any) => t.id)).toEqual([
        "ButtonSize",
        "IconName",
        "IconSize",
      ]);
      expect(overview.data.types).toEqual(["ButtonSize", "IconName", "IconSize"]);
    });

    test("an empty result from filters alone is a success", () => {
      const result = json(["components", "--deprecated", "Button"], inspectProject());
      expect(result.status).toBe(0);
      expect(result.data.components).toEqual([]);
    });

    test("stdout holds nothing but JSON; logs and warnings go to stderr", () => {
      const result = runCli([
        "--cwd",
        inspectProject(),
        "--log-level",
        "debug",
        "inspect",
        "components",
        "--format",
        "json",
      ]);

      expect(result.status).toBe(0);
      expect(() => JSON.parse(result.stdout)).not.toThrow();
      expect(result.stderr).toContain("debug: introspection:");
    });

    test("nothing about the repository leaks into the output", () => {
      const dir = inspectProject();
      for (const args of [[], ["components"]]) {
        expect(json(args, dir).data.git).toBeUndefined();
      }
      expect(runCli(["--cwd", dir, "inspect"]).stdout).not.toContain("Git:");
    });

    test("inherited props are listed by name", () => {
      const button = json(["components", "Button"], inspectProject()).data.components[0];
      expect(button.inherits[0].props).toContain("onClick");
    });
  });

  describe("search, for scripts", () => {
    test("--format json is a single search document on stdout", () => {
      const result = runCli([
        "--cwd",
        inspectProject(),
        "inspect",
        "search",
        "accent",
        "--format",
        "json",
      ]);

      expect(result.status).toBe(0);
      const data = JSON.parse(result.stdout);
      expect(data).toMatchObject({ schemaVersion: "2", kind: "search", queries: ["accent"] });
      expect(data.tokens[0]).toMatchObject({
        path: "system.color.accent",
        matchedIn: ["path", "css variable", "description"],
      });
      expect(data.suggestions).toBeUndefined();
    });
  });

  describe("recovery from mistakes", () => {
    test("an unknown name exits 2 with a suggestion on stderr and nothing on stdout", () => {
      const result = runCli(["--cwd", inspectProject(), "inspect", "components", "Buton"]);

      expect(result.status).toBe(2);
      expect(result.stderr).toContain("Did you mean `Button`?");
      expect(result.stdout).toBe("");
    });

    test("a search matching nothing exits 0 and suggests the closest names", () => {
      const result = runCli(["--cwd", inspectProject(), "inspect", "search", "acent"]);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("No matches. Did you mean `accent`?");
    });

    test("a blank search is a usage mistake", () => {
      const result = runCli(["--cwd", inspectProject(), "inspect", "search", " "]);

      expect(result.status).toBe(2);
      expect(result.stdout).toBe("");
    });

    test("--format json also prints the error on stdout, with the suggestions", () => {
      const result = runCli([
        "--cwd",
        inspectProject(),
        "inspect",
        "tokens",
        "system.colr",
        "--format",
        "json",
      ]);

      expect(result.status).toBe(2);
      expect(result.stderr).toContain("Did you mean `system.color`?");
      expect(JSON.parse(result.stdout)).toEqual({
        schemaVersion: "2",
        kind: "error",
        errors: [
          {
            message: expect.stringContaining("system.colr"),
            input: "system.colr",
            suggestions: expect.arrayContaining(["system.color"]),
          },
        ],
      });
    });

    test.each(["components", "types"])(
      "inspect %s without an introspection block exits 1 with a hint",
      (subcommand) => {
        const dir = makeScratchDir("inspect-no-block");
        copyFixture("valid", dir);
        const result = runCli(["--cwd", dir, "inspect", subcommand]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("no `introspection` block");
      },
    );

    test("the overview without an introspection block succeeds and omits components", () => {
      const dir = makeScratchDir("inspect-overview-no-block");
      copyFixture("valid", dir);
      const result = runCli(["--cwd", dir, "inspect"]);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("## Tokens");
      expect(result.stdout).not.toContain("## Components");
    });
  });

  test("inspect tokens never builds a TS program, so a broken entry doesn't matter", () => {
    const dir = makeScratchDir("inspect-broken-entry");
    copyFixture("inspect-broken-entry", dir);

    expect(runCli(["--cwd", dir, "inspect", "tokens", "ref"]).status).toBe(0);

    const components = runCli(["--cwd", dir, "inspect", "components"]);
    expect(components.status).toBe(1);
    expect(components.stderr).toContain("does-not-exist.ts");

    const asJson = runCli(["--cwd", dir, "inspect", "components", "--format", "json"]);
    expect(asJson.status).toBe(1);
    expect(JSON.parse(asJson.stdout)).toMatchObject({
      kind: "error",
      errors: [{ message: expect.stringContaining("does-not-exist.ts") }],
    });
  });

  test("the overview survives a broken entry and says why components are missing", () => {
    const dir = makeScratchDir("inspect-overview-broken-entry");
    copyFixture("inspect-broken-entry", dir);

    const markdown = runCli(["--cwd", dir, "inspect"]);
    expect(markdown.status).toBe(0);
    expect(markdown.stdout).toContain("## Tokens");
    expect(markdown.stdout).toMatch(/## Components\n\n_Unavailable: .*does-not-exist\.ts/);

    const json = JSON.parse(runCli(["--cwd", dir, "inspect", "--format", "json"]).stdout);
    expect(json.tokens.total).toBeGreaterThan(0);
    expect(json.components.error).toContain("does-not-exist.ts");
  });

  test("the command is discoverable from --help", () => {
    const result = runCli(["inspect", "--help"]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("recontent inspect tokens [path...]");
    expect(result.stdout).toContain("recontent inspect components [name...]");
    expect(runCli(["--help"]).stdout).toContain("inspect");
  });
});
