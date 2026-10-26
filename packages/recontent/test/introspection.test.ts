import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, test } from "@jest/globals";
import type { ComponentInfo, PropInfo } from "@recontentapp/core";
import { introspect } from "../src/introspection/index.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures/introspection");
const logger = { info() {}, warn() {}, error() {}, debug() {} };

let components: ComponentInfo[];
let warnings: string[];
let byName: Map<string, ComponentInfo>;

beforeAll(() => {
  ({ components, warnings } = introspect({
    config: { entry: "src/index.ts", exclude: ["Excluded"] },
    root,
    logger,
  }));
  byName = new Map(components.map((component) => [component.name, component]));
}, 60_000);

function component(name: string): ComponentInfo {
  const found = byName.get(name);
  if (!found) throw new Error(`${name} was not found in: ${[...byName.keys()].join(", ")}`);
  return found;
}

function prop(componentName: string, name: string): PropInfo {
  const found = component(componentName).props.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`${componentName}.${name} was not found`);
  return found;
}

const names = (componentName: string) => component(componentName).props.map((p) => p.name);

describe("components", () => {
  test("are sorted by name", () => {
    const sorted = components.map((c) => c.name).sort((a, b) => a.localeCompare(b));
    expect(components.map((c) => c.name)).toEqual(sorted);
  });

  test("props are sorted by name and source paths are relative to the root", () => {
    expect(names("A1")).toEqual(["disabled", "label"]);
    expect(component("A1")).toMatchObject({
      sourceFilePath: "src/a-declarations/a1-a2.tsx",
      line: 6,
    });
  });
});

describe("A. declaration forms", () => {
  test.each([
    ["A1 function + interface", "A1", ["disabled", "label"]],
    ["A2 arrow + type alias", "A2", ["count", "label"]],
    ["A3 React.FC", "A3", ["label"]],
    ["A4 React.FunctionComponent", "A4a", ["label"]],
    ["A4 FC imported by name", "A4b", ["label"]],
    ["A6 inline props", "A6", ["label", "tone"]],
    ["A7 class component", "A7", ["label", "size"]],
    ["A7 PureComponent", "A7Pure", ["label", "size"]],
    ["A8 default re-export", "Card", ["title"]],
    ["A9 renamed re-export", "Box", ["tone"]],
    ["A10 nested export * barrels", "FormInput", ["name"]],
    ["A10 nested export * barrels (two levels)", "DeepField", ["hint"]],
  ])("%s", (_label, name, expected) => {
    expect(names(name)).toEqual(expected);
  });

  test("A5 destructuring default", () => {
    expect(prop("A5", "size")).toMatchObject({ defaultValue: '"md"', values: ["sm", "md"] });
  });

  test("A6 inline props: required, optional and literal unions", () => {
    expect(prop("A6", "label")).toMatchObject({ required: true, type: "string" });
    expect(prop("A6", "tone")).toMatchObject({ required: false, values: ["a", "b"] });
  });

  test("A7 static defaultProps become defaultValue", () => {
    expect(prop("A7", "size").defaultValue).toBe('"sm"');
    expect(prop("A7Pure", "size").defaultValue).toBeUndefined();
  });

  test("A9 points at the original file", () => {
    expect(component("Box").sourceFilePath).toBe("src/a-declarations/internal-box.tsx");
  });
});

describe("B. wrappers and HOCs", () => {
  test.each([
    ["B1 memo(Component)", "B1", ["count", "label"]],
    ["B2 memo(inline)", "B2", ["value"]],
    ["B3 forwardRef<T, P>", "B3", ["label", "tone"]],
    ["B4 forwardRef, untyped call", "B4", ["label", "tone"]],
    ["B5 memo(forwardRef())", "B5", ["label", "tone"]],
    ["B6 React 19 ref as a prop", "B6", ["label", "ref"].sort()],
    ["B7 cast to a custom signature", "B7", ["as", "label", "tone"]],
    ["B8 custom HOC omitting a prop", "B8", ["label"]],
    ["B9 React.lazy", "B9", ["weight"]],
    ["B10 displayName assignment", "B10", ["label"]],
  ])("%s", (_label, name, expected) => {
    expect(names(name)).toEqual(expected);
  });

  test.each(["B3", "B4", "B5", "B10"])("%s: ref comes from @types/react", (name) => {
    expect(component(name).inherits).toEqual([
      { name: "RefAttributes", package: "@types/react", props: expect.arrayContaining(["ref"]) },
    ]);
  });

  test("B6 ref is an own prop", () => {
    expect(prop("B6", "ref")).toMatchObject({ required: false, type: "Ref<HTMLInputElement>" });
    expect(component("B6").inherits).toEqual([]);
  });

  test("B10 displayName is not a subcomponent", () => {
    expect([...byName.keys()].filter((name) => name.startsWith("B10"))).toEqual(["B10"]);
  });
});

describe("C. compound components", () => {
  test("C1 Object.assign", () => {
    expect([...byName.keys()].filter((name) => name.startsWith("Tabs"))).toEqual([
      "Tabs",
      "Tabs.List",
      "Tabs.Panel",
      "Tabs.Tab",
    ]);
    expect(names("Tabs.Tab")).toEqual(["id"]);
  });

  test("C2 static property assignment", () => {
    expect(names("C2")).toEqual(["elevated"]);
    expect(names("C2.Header")).toEqual(["title"]);
  });

  test("C3 namespace re-export", () => {
    expect(names("Sheet.Root")).toEqual(["open"]);
    expect(names("Sheet.Trigger")).toEqual(["label"]);
    expect(byName.has("Sheet")).toBe(false);
  });

  test("C4 plain object of components: members only", () => {
    expect(byName.has("Menu")).toBe(false);
    expect(names("Menu.Root")).toEqual(["open"]);
    expect(names("Menu.Item")).toEqual(["label"]);
  });

  test("C5 context provider is a normal component", () => {
    expect(names("C5Provider")).toEqual(["children", "theme"]);
  });
});

describe("D. props type shapes", () => {
  test("D1 interface extending HTML attributes", () => {
    expect(names("D1")).toEqual(["variant"]);
    expect(component("D1").inherits).toEqual([
      { name: "ButtonHTMLAttributes", package: "@types/react", props: expect.any(Array) },
    ]);
    const { props } = component("D1").inherits[0]!;
    expect(props.length).toBeGreaterThan(200);
    // Names from the group itself and from the bases folded into it, sorted.
    expect(props).toEqual(expect.arrayContaining(["type", "onClick", "aria-label"]));
    expect(props).toEqual([...props].sort((a, b) => a.localeCompare(b)));
  });

  test("D2 ComponentProps<'button'> & own", () => {
    expect(names("D2")).toEqual(["variant"]);
    expect(component("D2").inherits).toContainEqual(
      expect.objectContaining({ name: "ButtonHTMLAttributes", package: "@types/react" }),
    );
  });

  test("D3 Omit + own replacement", () => {
    expect(prop("D3", "size")).toMatchObject({ type: "Size", values: ["sm", "md", "lg"] });
    const inherited = component("D3").inherits;
    expect(inherited).toEqual([expect.objectContaining({ name: "InputHTMLAttributes" })]);
    expect(inherited[0]!.props.length).toBeGreaterThan(component("D1").inherits[0]!.props.length);
  });

  test("D4 PropsWithChildren: children is inherited", () => {
    expect(names("D4")).toEqual(["label"]);
    expect(component("D4").inherits).toEqual([
      { name: "PropsWithChildren", package: "@types/react", props: ["children"] },
    ]);
  });

  test("D5 literal unions", () => {
    expect(prop("D5", "s").values).toEqual(["a", "b"]);
    expect(prop("D5", "n").values).toEqual([1, 2, 3]);
    expect(prop("D5", "b").values).toEqual([true, "auto"]);
    expect(prop("D5", "m").values).toEqual(["x"]);
    expect(prop("D5", "flag").values).toBeUndefined();
    expect(prop("D5", "plain").values).toBeUndefined();
  });

  test("D6 named alias union keeps its name, values in source order", () => {
    expect(prop("D6", "density")).toMatchObject({
      type: "Density",
      values: ["dense", "comfy", "roomy"],
    });
  });

  test("D7 discriminated union props", () => {
    expect(names("D7")).toEqual(["as", "href", "onClick"]);
    expect(prop("D7", "as")).toMatchObject({ required: true, values: ["a", "button"] });
    expect(prop("D7", "href").required).toBe(false);
    expect(prop("D7", "onClick").required).toBe(false);
  });

  test("D8 generic component keeps its type parameter", () => {
    expect(prop("D8", "options").type).toBe("T[]");
    expect(prop("D8", "value").type).toBe("T");
    expect(component("D8").typeParameters).toEqual([{ name: "T" }]);
  });

  test("D14 a local alias is resolved, a library alias and a plain type are not", () => {
    const width = prop("D14", "width");
    expect(width.type).toBe("Width");
    // The checker orders union members by type id, not as written.
    expect(width.resolved?.split(" | ").sort()).toEqual(
      ['"100%"', '"auto"', "(string & {})", "number"].sort(),
    );
    expect(prop("D14", "onClick").type).toBe("MouseEventHandler<HTMLButtonElement>");
    expect(prop("D14", "onClick").resolved).toBeUndefined();
    expect(prop("D8", "options").resolved).toBeUndefined();
    // A literal union is already in `values`.
    expect(prop("D6", "density").resolved).toBeUndefined();
  });

  test("D15 type parameters keep their constraint and default", () => {
    expect(component("D15").typeParameters).toEqual([
      { name: "Value", constraint: "string" },
      { name: "Fallback", default: "Value" },
    ]);
    expect(component("D13").typeParameters).toBeUndefined();
  });

  test("D9 polymorphic as prop", () => {
    expect(prop("D9", "as")).toMatchObject({ type: "C", required: false });
    expect(names("D9")).toEqual(["as", "tone"]);
  });

  test("D10 extends chain across local interfaces", () => {
    expect(names("D10")).toEqual(["hint", "label", "placeholder"]);
    expect(component("D10").inherits).toEqual([]);
  });

  test("D11 props imported through a tsconfig path alias", () => {
    expect(names("D11")).toEqual(["level", "title"]);
  });

  test("D12 function and object types are printed verbatim", () => {
    expect(prop("D12", "onChange")).toMatchObject({ type: "(value: string) => void" });
    expect(prop("D12", "onChange").values).toBeUndefined();
    expect(prop("D12", "style")).toMatchObject({ type: "CSSProperties", required: false });
  });

  test("D13 no props", () => {
    expect(component("D13")).toMatchObject({ props: [], inherits: [] });
    expect(warnings.some((warning) => warning.startsWith("D13 "))).toBe(false);
  });
});

describe("E. wrapping external libraries", () => {
  test("E1 cva variants are own props with values", () => {
    expect(names("E1")).toEqual(["asChild", "size", "variant"]);
    expect(prop("E1", "variant").values).toEqual(["solid", "outline"]);
    expect(prop("E1", "size").values).toEqual(["sm", "md"]);
    expect(component("E1").inherits).toContainEqual(
      expect.objectContaining({ name: "ButtonHTMLAttributes", package: "@types/react" }),
    );
  });

  test("E2 wrapping Base UI", () => {
    expect(names("E2")).toEqual(["size"]);
    expect(component("E2").inherits).toContainEqual(
      expect.objectContaining({ package: "@base-ui/react" }),
    );
  });

  test("E3 re-exported library components: everything is inherited, with a warning", () => {
    const popup = component("Dialog.Popup");
    expect(popup.props).toEqual([]);
    expect(popup.inherits.some((group) => group.package === "@base-ui/react")).toBe(true);
    expect(warnings).toContainEqual(expect.stringMatching(/^Dialog\.Popup has no own props/));
  });
});

describe("F. JSDoc", () => {
  test("F1 descriptions", () => {
    expect(component("F1").description).toBe("Primary action");
    expect(prop("F1", "label").description).toBe("What the button says");
  });

  test("F2 @default", () => {
    expect(prop("F2", "size").defaultValue).toBe('"md"');
  });

  test("F3 @default wins over a destructuring default", () => {
    expect(prop("F3", "size").defaultValue).toBe('"lg"');
  });

  test("F4 @deprecated", () => {
    expect(prop("F4", "legacy").deprecated).toBe("Use tone instead");
    expect(component("F4").deprecated).toBe(true);
    expect(prop("F4", "tone").deprecated).toBeUndefined();
  });

  test("F5 docs survive Omit", () => {
    expect(prop("F5", "title").description).toBe("Kept through Omit");
  });
});

describe("G. things that are not components", () => {
  test.each(["useToast", "cn", "Sizes", "ButtonVariant", "ButtonVariants", "FormatDate"])(
    "%s is skipped",
    (name) => {
      expect(byName.has(name)).toBe(false);
    },
  );

  test("G4 non-React classes, G5 type-only exports, G6 exclude", () => {
    expect(byName.has("ToastManager")).toBe(false);
    expect(byName.has("A1Props")).toBe(false);
    expect(byName.has("Excluded")).toBe(false);
  });

  test("G7 an untyped JS function and a class that only has render are accepted, with a warning", () => {
    expect(byName.has("Untyped")).toBe(true);
    expect(byName.has("Printer")).toBe(true);
    expect(warnings).toContainEqual(
      expect.stringMatching(/^Untyped is treated as a component only because it returns `any`/),
    );
    expect(warnings).toContainEqual(
      expect.stringMatching(
        /^Printer is treated as a component only because it is a class with a `render` member/,
      ),
    );
    // Real components are not second-guessed, nor are class components.
    expect(warnings.filter((warning) => warning.includes("treated as a component"))).toHaveLength(
      2,
    );
  });

  test("no component name is lowercase or contains a stray separator", () => {
    for (const name of byName.keys())
      expect(name).toMatch(/^[A-Z][A-Za-z0-9]*(\.[A-Z][A-Za-z0-9]*)?$/);
  });
});

describe("H. failure modes", () => {
  test("H1 a type error in the props type does not stop introspection", () => {
    expect(names("H1")).toEqual(["broken", "label"]);
  });

  test("H3 self-referential props terminate", () => {
    expect(prop("H3", "children").type).toBe("TreeItemProps[]");
  });

  test("H2 a missing entry names the path", () => {
    expect(() => introspect({ config: { entry: "src/missing.ts" }, root, logger })).toThrow(
      path.join(root, "src/missing.ts"),
    );
  });

  test("H2 an entry outside the tsconfig names the path", () => {
    expect(() => introspect({ config: { entry: "outside/index.ts" }, root, logger })).toThrow(
      /outside[\\/]index\.ts" is not included by/,
    );
  });

  test("a missing tsconfig names the path", () => {
    expect(() =>
      introspect({ config: { entry: "src/index.ts", tsconfig: "nope.json" }, root, logger }),
    ).toThrow(path.join(root, "nope.json"));
  });
});

describe("performance and setup", () => {
  test("a rebuild with oldProgram reuses the parsed source files", () => {
    const first = introspect({ config: { entry: "src/index.ts" }, root, logger });
    const second = introspect({
      config: { entry: "src/index.ts" },
      root,
      logger,
      oldProgram: first.program,
    });

    const reused = second.program
      .getSourceFiles()
      .filter((file) => first.program.getSourceFile(file.fileName) === file);
    expect(reused.length).toBe(second.program.getSourceFiles().length);
  }, 60_000);

  test("zero components behind PascalCase exports is a warning, not silence", () => {
    const empty = path.join(root, "../introspection-empty");
    const result = introspect({ config: { entry: "src/index.ts" }, root: empty, logger });

    expect(result.components).toEqual([]);
    expect(result.warnings).toEqual([
      expect.stringMatching(/No React components found.*1 PascalCase/),
    ]);
  });

  test("the files it depends on include declarations from node_modules and the tsconfig", () => {
    const { files } = introspect({ config: { entry: "src/index.ts" }, root, logger });

    expect(files).toContain(path.join(root, "tsconfig.json"));
    expect(files.some((file) => /@types[\\/]react[\\/]index\.d\.ts$/.test(file))).toBe(true);
  }, 60_000);
});
