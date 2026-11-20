import { describe, expect, test } from "@jest/globals";
import type { ComponentInfo, TypeInfo } from "../../../src/introspection/model.js";
import {
  closestMatches,
  searchSnapshot,
  selectComponents,
  selectTokens,
  selectTypes,
} from "../../../src/cli/commands/inspect/select.js";
import { typeClosure } from "../../../src/introspection/types.js";
import type { DocToken } from "../../../src/snapshot/doc-token.js";
import { component, prop, token, typeInfo } from "../../helpers/inspect-model.js";

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

describe("searchSnapshot", () => {
  const snapshot = {
    tokens: [
      token("system.color.accent", "color", {
        cssVar: "--system-color-accent",
        alias: "ref.color.brand",
        description: "Primary action color.",
        values: { default: "#2563eb", dark: "#60a5fa" },
      }),
      token("system.color.danger", "color", { values: { default: "#ef4444" } }),
    ],
    components: [
      component("Button", {
        usage: "Prefer it over a link.",
        props: [prop("size", { description: "How big." })],
      }),
      component("Tooltip"),
    ],
    types: [
      typeInfo("IconName", [], { kind: "type", values: ["home", "tooltip"] }),
      typeInfo("ButtonProps", [], { members: [prop("variant")] }),
    ],
  };
  const search = (...queries: string[]) => searchSnapshot(snapshot, queries);
  const matchedIn = (hits: { item: unknown; matchedIn: string[] }[]) =>
    hits.map((hit) => hit.matchedIn);

  test.each([
    ["a token by value", "#EF4444", "tokens", ["value"]],
    ["a token by theme value", "60A5FA", "tokens", ["value (dark)"]],
    ["a token by CSS variable", "--system-color-accent", "tokens", ["css variable"]],
    ["a token by description", "primary action", "tokens", ["description"]],
    ["a component by usage", "over a link", "components", ["usage"]],
    ["a component by prop name", "size", "components", ["prop size"]],
    ["a type by literal value", "tooltip", "types", ["value"]],
  ] as const)("finds %s", (_name, query, kind, expected) => {
    expect(matchedIn(search(query)[kind])).toEqual([...expected].map((label) => [label]));
  });

  test("several queries match as a union", () => {
    const result = search("danger", "Button");
    expect(paths(result.tokens.map((hit) => hit.item))).toEqual(["system.color.danger"]);
    expect(result.components.map((hit) => hit.item.name)).toEqual(["Button"]);
    expect(result.types.map((hit) => hit.item.id)).toEqual(["ButtonProps"]);
  });

  test("a name or path hit ranks before a hit elsewhere, keeping the original order within each", () => {
    const result = searchSnapshot(
      {
        ...snapshot,
        tokens: [
          token("system.a", "color", { description: "tooltip" }),
          token("system.tooltip", "color"),
        ],
      },
      ["tooltip"],
    );
    expect(paths(result.tokens.map((hit) => hit.item))).toEqual(["system.tooltip", "system.a"]);
    expect(result.components.map((hit) => hit.item.name)).toEqual(["Tooltip"]);
  });

  test("no hit gives suggestions, and a hit does not", () => {
    expect(search("dangr")).toMatchObject({
      tokens: [],
      components: [],
      types: [],
      suggestions: ["danger"],
    });
    expect(search("danger").suggestions).toEqual([]);
  });
});
