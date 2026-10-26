import { describe, expect, test } from "@jest/globals";
import type { ComponentInfo } from "@recontentapp/core";
import {
  closestMatches,
  selectComponents,
  selectTokens,
} from "../src/cli/commands/inspect/select.js";
import { renderComponents, renderTokens } from "../src/cli/commands/inspect/render.js";
import type { DocToken } from "../src/plugins/shared/doc-token.js";

function token(path: string, type: DocToken["type"], extra: Partial<DocToken> = {}): DocToken {
  return {
    layer: path.split(".")[0] as DocToken["layer"],
    path,
    name: path.split(".").at(-1)!,
    type,
    cssVar: `--${path.replaceAll(".", "-")}`,
    values: { default: "x" },
    ...extra,
  };
}

const tokens = [
  token("ref.color.brand", "color"),
  token("system.color.accent", "color"),
  token("system.color.surface", "color"),
  token("system.color.legacy", "color", { deprecated: "Use accent." }),
  token("system.spacing.sm", "dimension"),
  token("system.spacing.sm-2", "dimension"),
];

const paths = (selected: DocToken[]) => selected.map((t) => t.path);

describe("selectTokens", () => {
  const select = (query: Partial<Parameters<typeof selectTokens>[2]>, themes = ["dark"]) =>
    selectTokens(tokens, themes, { paths: [], ...query });

  test("without a selector everything is selected", () => {
    expect(select({}).selected).toHaveLength(tokens.length);
  });

  test("an exact path selects one token", () => {
    expect(paths(select({ paths: ["system.color.accent"] }).selected)).toEqual([
      "system.color.accent",
    ]);
  });

  test("a prefix selects the subtree, on segment boundaries only", () => {
    expect(paths(select({ paths: ["system.color"] }).selected)).toEqual([
      "system.color.accent",
      "system.color.surface",
      "system.color.legacy",
    ]);
    expect(paths(select({ paths: ["system.spacing.sm"] }).selected)).toEqual(["system.spacing.sm"]);
  });

  test("several paths are combined", () => {
    expect(select({ paths: ["ref", "system.spacing"] }).selected).toHaveLength(3);
  });

  test("--type and --deprecated narrow the selection", () => {
    expect(paths(select({ type: "dimension" }).selected)).toEqual([
      "system.spacing.sm",
      "system.spacing.sm-2",
    ]);
    expect(paths(select({ deprecated: true }).selected)).toEqual(["system.color.legacy"]);
  });

  test("a filter matching nothing is not an error", () => {
    expect(select({ type: "shadow" })).toEqual({ selected: [], errors: [] });
    expect(select({ paths: ["ref"], deprecated: true })).toEqual({ selected: [], errors: [] });
  });

  test("an unknown type is an error with the closest matches", () => {
    const { selected, errors } = select({ type: "colr" });
    expect(selected).toEqual([]);
    expect(errors).toEqual([
      {
        message: 'No token type matches "colr". Did you mean `color`?',
        input: "colr",
        suggestions: ["color"],
      },
    ]);
  });

  test("an unknown path is an error with the closest matches", () => {
    const { selected, errors } = select({ paths: ["system.color.acent"] });
    expect(selected).toEqual([]);
    expect(errors).toEqual([
      {
        message: expect.stringContaining("Did you mean `system.color.accent`?"),
        input: "system.color.acent",
        suggestions: ["system.color.accent"],
      },
    ]);
  });

  test("an unknown group suggests the group", () => {
    expect(select({ paths: ["system.colr"] }).errors[0]?.suggestions).toContain("system.color");
  });

  test("an unknown theme is an error, a known one is not", () => {
    expect(select({ theme: "drak" }).errors[0]?.message).toContain("Did you mean `dark`?");
    expect(select({ theme: "dark" }).errors).toEqual([]);
  });
});

const component = (name: string, extra: Partial<ComponentInfo> = {}): ComponentInfo => ({
  name,
  sourceFilePath: "src/x.tsx",
  line: 1,
  props: [],
  inherits: [],
  ...extra,
});

describe("selectComponents", () => {
  const components = [
    component("Button"),
    component("Dialog.Root"),
    component("Dialog.Trigger", { deprecated: true }),
    component("Tabs"),
    component("Tabs.Item"),
  ];
  const select = (query: Parameters<typeof selectComponents>[1]) =>
    selectComponents(components, query);
  const names = (selected: ComponentInfo[]) => selected.map((c) => c.name);

  test("a name selects the component and its subcomponents", () => {
    expect(names(select({ names: ["Tabs"] }).selected)).toEqual(["Tabs", "Tabs.Item"]);
    expect(names(select({ names: ["Tabs.Item"] }).selected)).toEqual(["Tabs.Item"]);
  });

  test("a namespace name selects its members", () => {
    expect(names(select({ names: ["Dialog"] }).selected)).toEqual([
      "Dialog.Root",
      "Dialog.Trigger",
    ]);
  });

  test("--deprecated narrows, and may select nothing", () => {
    expect(names(select({ names: [], deprecated: true }).selected)).toEqual(["Dialog.Trigger"]);
    expect(select({ names: ["Button"], deprecated: true })).toEqual({ selected: [], errors: [] });
  });

  test("an unknown name suggests the closest component", () => {
    expect(select({ names: ["Buton"] }).errors).toEqual([
      {
        message: 'No component matches "Buton". Did you mean `Button`?',
        input: "Buton",
        suggestions: ["Button"],
      },
    ]);
  });
});

describe("closestMatches", () => {
  test("ignores case, ranks by distance and gives up on distant input", () => {
    expect(closestMatches("button", ["Button", "Buttons", "Banner"])).toEqual([
      "Button",
      "Buttons",
    ]);
    expect(closestMatches("zzzzzz", ["Button"])).toEqual([]);
  });
});

describe("renderComponents", () => {
  test("a long description is cut at a sentence or a word, never mid-word", () => {
    const sentence = component("A", { description: "Triggers an action. Then does more." });
    const long = component("B", {
      description: `${"word ".repeat(30)}end`,
    });
    const lines = renderComponents([sentence, long], { format: "markdown", summary: true });

    expect(lines).toContain("- `A` (0 props) — Triggers an action.\n");
    expect(lines).toMatch(/- `B` \(0 props\) — (word ){10,}word…\n/);
  });

  test("an empty list still ends with a Next hint", () => {
    expect(renderComponents([], { format: "markdown", summary: true }).trimEnd()).toMatch(
      /Next: `recontent inspect --help`$/,
    );
  });
});

describe("renderTokens", () => {
  const tokens = [
    token("system.color.accent", "color", { values: { default: "#fff", dark: "#000" } }),
    token("system.color.surface", "color", { values: { default: "#eee" } }),
  ];

  test("with --theme, json holds that theme for every token, falling back to the default", () => {
    const { tokens: shown } = JSON.parse(
      renderTokens(tokens, { format: "json", themes: ["dark"], theme: "dark", summary: false }),
    );

    expect(shown.map((t: DocToken) => t.values)).toEqual([
      { default: "#fff", dark: "#000" },
      { default: "#eee", dark: "#eee" },
    ]);
  });

  test("a summary of no tokens still ends with a Next hint", () => {
    expect(renderTokens([], { format: "markdown", themes: [], summary: true }).trimEnd()).toMatch(
      /Next: `recontent inspect --help`$/,
    );
  });
});
