import { describe, expect, test } from "@jest/globals";
import type { ComponentInfo, PropInfo } from "../../../src/introspection/model.js";
import {
  renderComponents,
  renderTokens,
  sharedDeclarations,
} from "../../../src/cli/commands/inspect/render.js";
import type { DocToken } from "../../../src/snapshot/doc-token.js";
import { component, prop, token, typeInfo } from "../../helpers/inspect-model.js";

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
