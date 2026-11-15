import { describe, expect, test } from "@jest/globals";
import type { ComponentInfo, PropInfo, TypeInfo } from "@recontentapp/core";
import {
  closestMatches,
  selectComponents,
  selectTokens,
  selectTypes,
} from "../src/cli/commands/inspect/select.js";
import {
  renderComponents,
  renderTokens,
  sharedDeclarations,
} from "../src/cli/commands/inspect/render.js";
import { typeClosure } from "../src/introspection/types.js";
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

const prop = (name: string, extra: Partial<PropInfo> = {}): PropInfo => ({
  name,
  type: "string",
  required: false,
  ...extra,
});

const component = (name: string, extra: Partial<ComponentInfo> = {}): ComponentInfo => ({
  name,
  sourceFilePath: "src/x.tsx",
  line: 1,
  props: [],
  inherits: [],
  references: [],
  ...extra,
});

describe("selectComponents --props", () => {
  const button = component("Button", {
    props: [prop("variant")],
    inherits: [{ name: "ButtonHTMLAttributes", props: ["id", "title"] }],
  });

  test("own and inherited props are accepted", () => {
    expect(
      selectComponents([button], { names: ["Button"], props: ["variant", "id"] }).errors,
    ).toEqual([]);
  });

  test("an unknown prop suggests the closest ones", () => {
    expect(selectComponents([button], { names: ["Button"], props: ["varient"] }).errors).toEqual([
      {
        message: 'No prop matches "varient". Did you mean `variant`?',
        input: "varient",
        suggestions: ["variant"],
      },
    ]);
  });

  test("without a component name there is nothing to narrow", () => {
    expect(selectComponents([button], { names: [], props: ["variant"] }).errors).toHaveLength(1);
  });
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

const typeInfo = (
  id: string,
  references: string[] = [],
  extra: Partial<TypeInfo> = {},
): TypeInfo => ({
  id,
  name: id.replace(/ \(.*/, ""),
  kind: "interface",
  sourceFilePath: "src/x.ts",
  line: 1,
  definition: `interface ${id} {}`,
  references,
  ...extra,
});

describe("selectTypes", () => {
  const types = [
    typeInfo("Entry (src/a.ts)"),
    typeInfo("Entry (src/b.ts)"),
    typeInfo("IconName", [], { deprecated: true }),
    typeInfo("TabItem", ["IconName"]),
  ];
  const select = (query: Parameters<typeof selectTypes>[1]) => selectTypes(types, query);
  const ids = (selected: TypeInfo[]) => selected.map((t) => t.id);

  test("an id selects one type, a shared name selects every type with it", () => {
    expect(ids(select({ names: ["TabItem"] }).selected)).toEqual(["TabItem"]);
    expect(ids(select({ names: ["Entry"] }).selected)).toEqual([
      "Entry (src/a.ts)",
      "Entry (src/b.ts)",
    ]);
    expect(ids(select({ names: ["Entry (src/b.ts)"] }).selected)).toEqual(["Entry (src/b.ts)"]);
  });

  test("--deprecated narrows", () => {
    expect(ids(select({ names: [], deprecated: true }).selected)).toEqual(["IconName"]);
  });

  test("an unknown name suggests the closest type", () => {
    expect(select({ names: ["TabItm"] }).errors).toEqual([
      {
        message: 'No type matches "TabItm". Did you mean `TabItem`?',
        input: "TabItm",
        suggestions: ["TabItem"],
      },
    ]);
  });
});

describe("typeClosure", () => {
  const types = [
    typeInfo("A", ["B", "C"]),
    typeInfo("B", ["D"]),
    typeInfo("C", ["D", "A"]),
    typeInfo("D"),
    typeInfo("Unrelated"),
  ];
  const ids = (selected: TypeInfo[]) => selected.map((t) => t.id);

  test("follows references transitively, each type once, the given ones first", () => {
    expect(ids(typeClosure(["B"], types))).toEqual(["B", "D"]);
    expect(ids(typeClosure(["C", "B"], types))).toEqual(["C", "B", "D", "A"]);
  });

  test("terminates on cycles and ignores unknown ids", () => {
    expect(ids(typeClosure(["A", "Missing"], types))).toEqual(["A", "B", "C", "D"]);
    expect(typeClosure([], types)).toEqual([]);
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
    const lines = renderComponents([sentence, long], {
      format: "markdown",
      summary: true,
      types: [],
    });

    expect(lines).toContain("- `A` (0 props) — Triggers an action.\n");
    expect(lines).toMatch(/- `B` \(0 props\) — (word ){10,}word…\n/);
  });

  test("an empty list still ends with a Next hint", () => {
    expect(
      renderComponents([], { format: "markdown", summary: true, types: [] }).trimEnd(),
    ).toMatch(/Next: `recontent inspect --help`$/);
  });
});

describe("renderComponents, compactly", () => {
  const base = typeInfo("BaseProps", [], {
    sourceFilePath: "src/base.ts",
    members: [prop("gap"), prop("color")],
  });
  const shared = (name: string, own: PropInfo[]) =>
    component(name, {
      sourceFilePath: `src/${name}.tsx`,
      props: [
        prop("gap", { declaredIn: "BaseProps" }),
        prop("color", { declaredIn: "BaseProps" }),
        ...own,
      ],
    });
  const a = shared("A", [prop("kind")]);
  const b = shared("B", []);
  const render = (selected: ComponentInfo[], props?: string[]) =>
    renderComponents(selected, {
      format: "markdown",
      summary: false,
      types: [base],
      shared: sharedDeclarations([a, b]),
      props,
    });

  test("sharedDeclarations is what two components or more declare through", () => {
    expect([...sharedDeclarations([a, b])]).toEqual(["BaseProps"]);
    expect([...sharedDeclarations([a])]).toEqual([]);
  });

  test("shared props are summarized on the Also accepts line, and the table keeps the rest", () => {
    const output = render([a]);
    expect(output).toContain("| `kind` |");
    expect(output).not.toContain("| `gap` |");
    expect(output).toContain("Also accepts: `BaseProps` (2 props: gap, color)");
  });

  test("the component that owns the declaration still lists its props", () => {
    const owner = component("BaseBox", {
      sourceFilePath: "src/base.ts",
      props: [prop("gap", { declaredIn: "BaseProps" })],
    });
    const output = renderComponents([owner], {
      format: "markdown",
      summary: false,
      types: [base],
      shared: new Set(["BaseProps"]),
    });
    expect(output).toContain("| `gap` |");
    expect(output).not.toContain("Also accepts");
  });

  test("--props lists those props only, whatever is shared, and nothing is cut", () => {
    const values = Array.from({ length: 20 }, (_, index) => `v${index}`);
    const wide = component("W", { props: [prop("tone", { values })] });
    expect(render([wide])).toContain("… 8 more");
    const output = render([wide], ["tone"]);
    expect(output).toContain("v19");
    expect(output).not.toContain("more");

    const full = render([a], ["gap"]);
    expect(full).toContain("| `gap` |");
    expect(full).not.toContain("| `kind` |");
  });

  test("a long union is cut between members", () => {
    const type = Array.from({ length: 60 }, (_, index) => `"option${index}"`).join(" | ");
    const output = render([component("W", { props: [prop("tone", { type })] })]);
    expect(output).toContain("| …`");
    expect(output).not.toContain("option59");
    expect(output.length).toBeLessThan(type.length);
  });

  test("the Types section holds the object types the props name; the others are only listed", () => {
    const item = typeInfo("Item", [], { members: [prop("id")] });
    const tone = typeInfo("Tone", [], { values: ["a", "b"] });
    const withTypes = component("T", {
      props: [prop("item", { references: ["Item"] }), prop("tone", { references: ["Tone"] })],
      references: ["Item", "Tone"],
    });
    const output = renderComponents([withTypes], {
      format: "markdown",
      summary: false,
      types: [item, tone],
    });
    expect(output).toContain("## Types");
    expect(output).toContain("### Item");
    expect(output).not.toContain("### Tone");
    expect(output).toContain("More types: `Tone`");
    expect(output).toMatch(/Next: .*recontent inspect types/);
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
