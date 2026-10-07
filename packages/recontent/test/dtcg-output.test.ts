import { describe, expect, test } from "@jest/globals";
import {
  defineComponentTokens,
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "../src/index.js";
import { generateDtcg, generateDtcgThemed } from "../src/plugins/dtcg.js";

function fullTreeConfig() {
  const ref = defineReferenceTokens({
    color: {
      black: tokens.color("#000000"),
      white: tokens.color("#ffffff"),
    },
    spacing: tokens.dimensionScale({ 0: "0px", 1: "4px", 2: "8px" }),
  });
  const system = defineSystemTokens({
    colors: {
      accent: ref.color.black.describe("Primary accent color."),
      surface: ref.color.white,
    },
    shadow: {
      elevated: tokens.shadow([
        {
          color: ref.color.black,
          offsetX: "0px",
          offsetY: "2px",
          blur: "4px",
          spread: "0px",
          inset: true,
        },
        { color: "#111111", offsetX: "0px", offsetY: "1px", blur: "2px", spread: "0px" },
      ]),
    },
    gradient: {
      accent: tokens.gradient({
        kind: "linear",
        angle: "90deg",
        stops: [
          { color: ref.color.black, position: 0 },
          { color: ref.color.white, position: 1 },
        ],
      }),
    },
  });
  const components = defineComponentTokens({
    button: { background: system.colors.accent.deprecate("Use system.colors.surface instead.") },
  });

  return defineConfig({
    tokens: { ref, system, components },
    themes: {
      dark: defineTheme(system, { colors: { accent: tokens.color("#eeeeee") } }),
    },
  });
}

test("generateDtcg produces a full snapshot for a mixed-type tree", () => {
  const config = fullTreeConfig();
  expect(generateDtcg(config)).toMatchSnapshot();
});

test("generateDtcgThemed applies overrides at non-ref layers (regression)", () => {
  const config = fullTreeConfig();
  const base = generateDtcg(config);
  const themed = generateDtcgThemed(config, "dark");
  expect(themed).not.toEqual(base);
  expect(
    (themed as never as { system: { colors: { accent: { $value: unknown } } } }).system.colors
      .accent.$value,
  ).toMatchObject({ hex: "#eeeeee" });
});

test("alias paths nest correctly in DTCG output", () => {
  const config = fullTreeConfig();
  const output = generateDtcg(config) as never as {
    system: { colors: { surface: { $value: string } } };
  };
  expect(output.system.colors.surface.$value).toBe("{ref.color.white}");
});

test("$description and $deprecated are emitted", () => {
  const config = fullTreeConfig();
  const output = generateDtcg(config) as never as {
    system: { colors: { accent: { $description?: string } } };
    button: { background: { $deprecated?: string } };
  };
  expect(output.system.colors.accent.$description).toBe("Primary accent color.");
  expect(output.button.background.$deprecated).toBe("Use system.colors.surface instead.");
});

test("group-level $type hoisting collapses a homogeneous group", () => {
  const config = fullTreeConfig();
  const output = generateDtcg(config) as never as {
    ref: { color: { $type?: string; black: { $type?: string } } };
  };
  expect(output.ref.color.$type).toBe("color");
  expect(output.ref.color.black.$type).toBeUndefined();
});

test("inset is emitted inside $value, not as an extension", () => {
  const config = fullTreeConfig();
  const output = generateDtcg(config) as never as {
    system: {
      shadow: { elevated: { $value: Array<{ inset?: boolean }>; $extensions?: unknown } };
    };
  };
  const [first, second] = output.system.shadow.elevated.$value;
  expect(first!.inset).toBe(true);
  expect(second!.inset).toBeUndefined();
});

describe("array aliasing (§9.1)", () => {
  test("a gradient stop can reference another gradient token", () => {
    const ref = defineReferenceTokens({
      gradient: {
        base: tokens.gradient({
          stops: [
            { color: "#000000", position: 0 },
            { color: "#ffffff", position: 1 },
          ],
        }),
      },
    });
    const system = defineSystemTokens({
      gradient: {
        composed: tokens.gradient({
          stops: [ref.gradient.base, { color: "#ff0000", position: 0.5 }],
        }),
      },
    });
    const config = defineConfig({
      tokens: { ref, system, components: {} },
    });
    const output = generateDtcg(config) as never as {
      system: { gradient: { composed: { $value: unknown[] } } };
    };
    expect(output.system.gradient.composed.$value[0]).toBe("{ref.gradient.base}");
  });
});

describe("scale metadata", () => {
  function scaleMetadataConfig() {
    const ref = defineReferenceTokens({
      spacing: tokens
        .dimensionScale({ 0: "0px", 1: "4px" })
        .describe("Spacing scale")
        .deprecate("Use system.spacing")
        .extend("com.example", { team: "design" }),
      plain: tokens.dimensionScale({ a: "1px", b: "2px" }),
    });
    return defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
      themes: { dark: defineTheme(ref, { plain: tokens.dimensionScale({ a: "9px", b: "2px" }) }) },
    });
  }

  type Group = { $description?: string; $deprecated?: string; $extensions?: unknown };

  test("scale metadata is emitted on the group node", () => {
    const output = generateDtcg(scaleMetadataConfig()) as never as {
      ref: { spacing: Group & { 0: Group }; plain: Group };
    };
    expect(output.ref.spacing.$description).toBe("Spacing scale");
    expect(output.ref.spacing.$deprecated).toBe("Use system.spacing");
    expect(output.ref.spacing.$extensions).toEqual({ "com.example": { team: "design" } });
    expect(output.ref.spacing[0].$deprecated).toBeUndefined();
    expect(output.ref.plain.$description).toBeUndefined();
    expect(output.ref.plain.$deprecated).toBeUndefined();
  });

  test("scale metadata is emitted in themed output too", () => {
    const output = generateDtcgThemed(scaleMetadataConfig(), "dark") as never as {
      ref: { spacing: Group };
    };
    expect(output.ref.spacing.$description).toBe("Spacing scale");
    expect(output.ref.spacing.$deprecated).toBe("Use system.spacing");
  });
});

describe("em dimensions", () => {
  // DTCG only supports px and rem, so em is emitted as rem.
  test("em is emitted as rem, including inside composites and dash arrays", () => {
    const ref = defineReferenceTokens({
      gap: tokens.dimension("0.5em"),
      px: tokens.dimension("4px"),
      type: tokens.typography({
        fontFamily: "Inter",
        fontSize: "1.25em",
        fontWeight: 400,
        letterSpacing: "-0.05em",
      }),
      dash: tokens.strokeStyle({ dashArray: ["0.5em", "2px"], lineCap: "round" }),
    });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    const output = generateDtcg(config) as never as {
      ref: {
        gap: { $value: unknown };
        px: { $value: unknown };
        type: { $value: { fontSize: unknown; letterSpacing: unknown } };
        dash: { $value: { dashArray: unknown[] } };
      };
    };

    expect(output.ref.gap.$value).toEqual({ value: 0.5, unit: "rem" });
    expect(output.ref.px.$value).toEqual({ value: 4, unit: "px" });
    expect(output.ref.type.$value.fontSize).toEqual({ value: 1.25, unit: "rem" });
    expect(output.ref.type.$value.letterSpacing).toEqual({ value: -0.05, unit: "rem" });
    expect(output.ref.dash.$value.dashArray).toEqual([
      { value: 0.5, unit: "rem" },
      { value: 2, unit: "px" },
    ]);
    expect(JSON.stringify(output)).not.toContain('"em"');
  });
});
