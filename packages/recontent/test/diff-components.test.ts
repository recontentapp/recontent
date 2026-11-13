import { describe, expect, test } from "@jest/globals";
import type { ComponentInfo, PropInfo, TypeInfo } from "@recontentapp/core";
import { countComponentBreakingChanges, diffComponents } from "../src/cli/diff/components.js";
import { formatDiff } from "../src/cli/diff/diff.js";

function prop(name: string, overrides: Partial<PropInfo> = {}): PropInfo {
  return { name, type: "string", required: false, ...overrides };
}

function component(overrides: Partial<ComponentInfo> = {}): ComponentInfo {
  return {
    name: "Button",
    sourceFilePath: "src/button.tsx",
    line: 1,
    props: [],
    inherits: [],
    references: [],
    ...overrides,
  };
}

function type(overrides: Partial<TypeInfo> = {}): TypeInfo {
  return {
    id: "Size",
    name: "Size",
    kind: "type",
    sourceFilePath: "src/size.ts",
    line: 1,
    definition: 'type Size = "sm" | "md"',
    values: ["sm", "md"],
    references: [],
    ...overrides,
  };
}

type ComponentsSnapshot = Parameters<typeof diffComponents>[0];

const snapshot = (
  components: ComponentInfo[] = [],
  types: TypeInfo[] = [],
): ComponentsSnapshot => ({ components, types });

function diffProps(base: PropInfo[], head: PropInfo[]) {
  const diff = diffComponents(
    snapshot([component({ props: base })]),
    snapshot([component({ props: head })]),
  );
  return { diff, breaking: countComponentBreakingChanges(diff) };
}

describe("components", () => {
  test("a removed component is breaking, an added one is not", () => {
    const removed = diffComponents(snapshot([component()]), snapshot());
    expect(removed.components.removed.map((c) => c.name)).toEqual(["Button"]);
    expect(countComponentBreakingChanges(removed)).toBe(1);

    const added = diffComponents(snapshot(), snapshot([component()]));
    expect(added.components.added.map((c) => c.name)).toEqual(["Button"]);
    expect(countComponentBreakingChanges(added)).toBe(0);
  });

  test("a renamed component is a removal plus an addition", () => {
    const diff = diffComponents(snapshot([component()]), snapshot([component({ name: "Btn" })]));
    expect(diff.components.removed).toHaveLength(1);
    expect(diff.components.added).toHaveLength(1);
    expect(countComponentBreakingChanges(diff)).toBe(1);
  });

  test("a removed prop is breaking", () => {
    expect(diffProps([prop("size")], []).breaking).toBe(1);
  });

  test("an added prop is breaking only when required", () => {
    expect(diffProps([], [prop("size")]).breaking).toBe(0);
    expect(diffProps([], [prop("size", { required: true })]).breaking).toBe(1);
  });

  test("optional becoming required is breaking, the reverse is not", () => {
    expect(diffProps([prop("size")], [prop("size", { required: true })]).breaking).toBe(1);
    expect(diffProps([prop("size", { required: true })], [prop("size")]).breaking).toBe(0);
  });

  test("a literal value that goes away is breaking, one that is added is not", () => {
    const values = (list: string[]) => prop("variant", { type: list.join(" | "), values: list });
    const narrowed = diffProps([values(["a", "b"])], [values(["a"])]);
    expect(narrowed.breaking).toBe(1);
    // The type text changed too, but only the values are reported.
    expect(narrowed.diff.components.changed[0]!.changes).toHaveLength(1);

    expect(diffProps([values(["a"])], [values(["a", "b"])]).breaking).toBe(0);
    expect(diffProps([values(["a", "b"])], [values(["b", "a"])]).diff.components.changed).toEqual(
      [],
    );
  });

  test("any other type change is breaking, resolved aliases and layout aside", () => {
    expect(
      diffProps([prop("x", { type: "string" })], [prop("x", { type: "number" })]).breaking,
    ).toBe(1);
    expect(
      diffProps(
        [prop("x", { type: "Width", resolved: "number | 'auto'" })],
        [prop("x", { type: "Size", resolved: "number | 'auto'" })],
      ).diff.components.changed,
    ).toEqual([]);
    expect(
      diffProps([prop("x", { type: "{ a: 1 }" })], [prop("x", { type: "{\n  a: 1\n}" })]).diff
        .components.changed,
    ).toEqual([]);
  });

  test("a default or deprecation change is not breaking", () => {
    const { diff, breaking } = diffProps(
      [prop("x", { defaultValue: '"a"' })],
      [prop("x", { defaultValue: '"b"', deprecated: true })],
    );
    expect(diff.components.changed[0]!.changes).toHaveLength(2);
    expect(breaking).toBe(0);
  });

  test("dropping inherited props is breaking, unless the component now declares them", () => {
    const inherits = (props: string[]) => [{ name: "ButtonHTMLAttributes", props }];
    const diff = (base: string[], headProps: string[], head: string[]) =>
      diffComponents(
        snapshot([component({ inherits: inherits(base) })]),
        snapshot([
          component({ inherits: inherits(head), props: headProps.map((name) => prop(name)) }),
        ]),
      );

    expect(countComponentBreakingChanges(diff(["disabled", "form"], [], ["disabled"]))).toBe(1);
    expect(
      countComponentBreakingChanges(
        diffComponents(
          snapshot([component({ inherits: inherits(["disabled"]) })]),
          snapshot([component()]),
        ),
      ),
    ).toBe(1);
    expect(countComponentBreakingChanges(diff(["disabled", "form"], ["form"], ["disabled"]))).toBe(
      0,
    );
    expect(countComponentBreakingChanges(diff(["disabled"], [], ["disabled", "form"]))).toBe(0);
  });

  test("type parameters: breaking when added without a default or constrained differently", () => {
    const diff = (base: ComponentInfo["typeParameters"], head: ComponentInfo["typeParameters"]) =>
      countComponentBreakingChanges(
        diffComponents(
          snapshot([component({ typeParameters: base })]),
          snapshot([component({ typeParameters: head })]),
        ),
      );

    expect(diff(undefined, [{ name: "T" }])).toBe(1);
    expect(diff(undefined, [{ name: "T", default: "string" }])).toBe(0);
    expect(diff([{ name: "T" }], [{ name: "T", constraint: "object" }])).toBe(1);
    expect(diff([{ name: "T", default: "a" }], [{ name: "T", default: "b" }])).toBe(0);
    expect(diff([{ name: "T" }], undefined)).toBe(1);
  });

  test("a deprecated component is not breaking", () => {
    const diff = diffComponents(
      snapshot([component()]),
      snapshot([component({ deprecated: true })]),
    );
    expect(diff.components.changed).toHaveLength(1);
    expect(countComponentBreakingChanges(diff)).toBe(0);
  });

  test("ignores line, file, date, description, references and a type's raw definition", () => {
    const base = snapshot(
      [component({ props: [prop("x", { description: "a", references: ["Size"] })] })],
      [type()],
    );
    const head = snapshot(
      [
        component({
          line: 40,
          sourceFilePath: "src/ui/button.tsx",
          lastUpdatedAt: "2026-01-01T00:00:00Z",
          description: "Now documented.",
          references: ["Size"],
          props: [prop("x", { description: "b" })],
        }),
      ],
      [type({ line: 9, definition: 'type Size = | "sm" | "md" // reworded', description: "New." })],
    );

    const diff = diffComponents(base, head);
    expect(diff.components.changed).toEqual([]);
    expect(diff.types.changed).toEqual([]);
  });
});

describe("types", () => {
  const diffTypes = (base: TypeInfo, head: TypeInfo) => {
    const diff = diffComponents(snapshot([], [base]), snapshot([], [head]));
    return { diff, breaking: countComponentBreakingChanges(diff) };
  };

  test("a removed type is breaking, an added one is not", () => {
    expect(countComponentBreakingChanges(diffComponents(snapshot([], [type()]), snapshot()))).toBe(
      1,
    );
    expect(countComponentBreakingChanges(diffComponents(snapshot(), snapshot([], [type()])))).toBe(
      0,
    );
  });

  test("a kind change is breaking", () => {
    expect(diffTypes(type(), type({ kind: "enum" })).breaking).toBe(1);
  });

  test("enum and union values: breaking only when one is lost", () => {
    expect(diffTypes(type(), type({ values: ["sm"] })).breaking).toBe(1);
    expect(diffTypes(type(), type({ values: ["sm", "md", "lg"] })).breaking).toBe(0);
  });

  test("members are diffed like props", () => {
    const interfaceWith = (members: PropInfo[]) =>
      type({ kind: "interface", definition: "interface Size {}", values: undefined, members });

    expect(diffTypes(interfaceWith([prop("a")]), interfaceWith([])).breaking).toBe(1);
    expect(
      diffTypes(interfaceWith([]), interfaceWith([prop("a", { required: true })])).breaking,
    ).toBe(1);
    expect(diffTypes(interfaceWith([]), interfaceWith([prop("a")])).breaking).toBe(0);
  });

  test("falls back to the definition when there are no members or values", () => {
    const fn = (definition: string) => type({ definition, values: undefined });
    expect(diffTypes(fn("type Size = () => void"), fn("type Size = (a: 1) => void")).breaking).toBe(
      1,
    );
    expect(diffTypes(fn("type Size = () => void"), fn("type Size = () => void")).breaking).toBe(0);
  });

  test("types are matched by id", () => {
    const diff = diffComponents(
      snapshot([], [type({ id: "Size (src/a.ts)" })]),
      snapshot([], [type({ id: "Size (src/b.ts)" })]),
    );
    expect(diff.types.removed).toHaveLength(1);
    expect(diff.types.added).toHaveLength(1);
  });
});

describe("formatDiff with components", () => {
  const tokens = {
    added: [],
    removed: [],
    renamed: [],
    retyped: [],
    changed: [],
    metadata: [],
    themes: { addedThemes: [], removedThemes: [], changedThemes: {} },
  };

  test("renders components and types sections, and leaves empty ones out", () => {
    const components = diffComponents(
      snapshot(
        [
          component({ props: [prop("size"), prop("tone", { type: "string" })] }),
          component({ name: "Old" }),
        ],
        [type()],
      ),
      snapshot(
        [
          component({ props: [prop("tone", { type: "number" }), prop("dense")] }),
          component({ name: "Card" }),
        ],
        [type({ values: ["sm", "md", "lg"] }), type({ id: "Gap", name: "Gap" })],
      ),
    );

    const output = formatDiff({ tokens, components });

    expect(output).not.toContain("# Tokens");
    expect(output).toContain("# Components\n\n## Breaking (3)");
    expect(output).toContain("- `Old`: **removed**");
    expect(output).toContain(
      "- `Button`\n  - **prop** `tone`: type `string` -> `number`\n  - **removed prop** `size`",
    );
    expect(output).toContain("## Added (1)\n\n- `Card`");
    expect(output).toContain("- `Button`\n  - **added prop** `dense` (optional)");
    expect(output).toContain("# Types\n\n## Added (1)\n\n- `Gap` (type)");
    expect(output).toContain('- `Size`\n  - **values** added value `"lg"`');
  });

  test("says when nothing changed, and why components were skipped", () => {
    const none = diffComponents(snapshot([component()]), snapshot([component()]));
    expect(formatDiff({ tokens, components: none }, "markdown", { config: "", rev: "v1" })).toBe(
      "No changes between the working tree and v1.",
    );
    expect(
      formatDiff({ tokens, componentsNote: "Components were not compared: v1 has none." }),
    ).toBe(
      "No changes between the working tree and HEAD.\n\nComponents were not compared: v1 has none.",
    );
  });

  test("json nests the diffs and counts them", () => {
    const components = diffComponents(snapshot([component()]), snapshot());
    const parsed = JSON.parse(formatDiff({ tokens, components }, "json"));
    expect(parsed.counts.components).toEqual({ added: 0, removed: 1, changed: 0, breaking: 1 });
    expect(parsed.counts.types).toEqual({ added: 0, removed: 0, changed: 0, breaking: 0 });
    expect(parsed.counts.breaking).toBe(1);
    expect(parsed.components.removed[0].name).toBe("Button");
    expect(parsed.tokens).toEqual(tokens);

    const skipped = JSON.parse(formatDiff({ tokens, componentsNote: "skipped" }, "json"));
    expect(skipped.components).toBeUndefined();
    expect(skipped.counts.components).toBeUndefined();
    expect(skipped.componentsNote).toBe("skipped");
  });
});
