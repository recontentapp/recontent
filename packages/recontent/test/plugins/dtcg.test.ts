import { describe, expect, test } from "@jest/globals";
import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  defineThemeAxis,
  tokens,
} from "../../src/index.js";
import {
  dtcg,
  generateDtcg,
  generateDtcgDelta,
  generateDtcgResolver,
} from "../../src/plugins/dtcg.js";
import { runPlugins } from "../../src/plugins/runner.js";
import { goldenConfig, refOnlyConfig, themedConfig } from "../helpers/fixtures.js";

test("generateDtcgDelta emits only overridden entries, including at non-ref layers", () => {
  const { config } = goldenConfig();
  const highContrast = config.themes[0]!.contexts.highContrast!;
  const delta = generateDtcgDelta(config.registry, highContrast) as never as {
    ref?: unknown;
    system: { colors: { accent: { $value: unknown }; surface: { $value: unknown } } };
  };
  expect(delta.ref).toBeUndefined();
  expect(delta.system.colors.accent.$value).toMatchObject({ hex: "#ff0000" });
  expect(delta.system.colors.surface.$value).toBe("{ref.color.black}");
});

test("generateDtcgDelta emits a reference for a theme alias", () => {
  const { config } = themedConfig({ layer: "system", alias: true });
  const dark = config.themes[0]!.contexts.dark!;
  const delta = generateDtcgDelta(config.registry, dark) as never as {
    system: { colors: { accent: { $value: unknown } } };
  };
  expect(delta.system.colors.accent.$value).toBe("{ref.color.white}");
});

test("alias paths nest correctly in DTCG output", () => {
  const { config } = goldenConfig();
  const output = generateDtcg(config) as never as {
    system: { colors: { surface: { $value: string } } };
  };
  expect(output.system.colors.surface.$value).toBe("{ref.color.white}");
});

test("$description and $deprecated are emitted", () => {
  const { config } = goldenConfig();
  const output = generateDtcg(config) as never as {
    system: { colors: { accent: { $description?: string } } };
    button: { background: { $deprecated?: string } };
  };
  expect(output.system.colors.accent.$description).toBe("Primary accent color.");
  expect(output.button.background.$deprecated).toBe("Use system.colors.surface instead.");
});

test("group-level $type hoisting collapses a homogeneous group", () => {
  const { config } = goldenConfig();
  const output = generateDtcg(config) as never as {
    ref: { color: { $type?: string; black: { $type?: string } } };
  };
  expect(output.ref.color.$type).toBe("color");
  expect(output.ref.color.black.$type).toBeUndefined();
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

test("a strokeStyle dash can reference a dimension token", () => {
  const ref = defineReferenceTokens({ dash: tokens.dimension("4px") });
  const system = defineSystemTokens({
    dashed: tokens.strokeStyle({ dashArray: [ref.dash, "2px"], lineCap: "round" }),
  });
  const config = defineConfig({ tokens: { ref, system, components: {} } });
  const output = generateDtcg(config) as never as {
    system: { dashed: { $value: { dashArray: unknown[] } } };
  };
  expect(output.system.dashed.$value.dashArray).toEqual(["{ref.dash}", { value: 2, unit: "px" }]);
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

  test("delta output omits untouched scales and base-only metadata", () => {
    const cfg = scaleMetadataConfig();
    const dark = cfg.themes[0]!.contexts.dark!;
    const output = generateDtcgDelta(cfg.registry, dark) as never as {
      ref: { spacing?: Group; plain: Group };
    };
    expect(output.ref.spacing).toBeUndefined();
    expect(output.ref.plain.$description).toBeUndefined();
  });
});

test("group metadata is emitted on the group node", () => {
  const ref = defineReferenceTokens({
    color: tokens
      .group({ black: tokens.color("#000000") })
      .describe("Base colors")
      .deprecate("Use system.color"),
  });
  const config = defineConfig({ tokens: { ref, system: defineSystemTokens({}), components: {} } });
  const output = generateDtcg(config) as never as {
    ref: { color: { $description?: string; $deprecated?: string } };
  };
  expect(output.ref.color.$description).toBe("Base colors");
  expect(output.ref.color.$deprecated).toBe("Use system.color");
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
    const config = refOnlyConfig(ref);
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

  test("each em dimension is reported, since rem is relative to something else", () => {
    const ref = defineReferenceTokens({
      gap: tokens.dimension("0.5em"),
      px: tokens.dimension("4px"),
      type: tokens.typography({
        fontFamily: "Inter",
        fontSize: "16px",
        fontWeight: 400,
        letterSpacing: "-0.05em",
      }),
      dash: tokens.strokeStyle({ dashArray: ["0.5em", "2px"], lineCap: "round" }),
    });
    const ctx = { ...refOnlyConfig(ref), themes: [] } as never;

    const warnings = dtcg({ outDir: "out" }).validate!(ctx) as {
      severity: string;
      message: string;
    }[];

    expect(warnings.map((warning) => warning.severity)).toEqual(["warning", "warning", "warning"]);
    expect(warnings.map((warning) => warning.message.split(" is in")[0])).toEqual([
      '"ref.gap"',
      '"ref.type.letterSpacing"',
      '"ref.dash.dashArray"',
    ]);
  });
});

describe("DTCG 2025.10 resolver & delta files", () => {
  test("omits tokens.resolver.json when no themes are configured", async () => {
    const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
    const config = defineConfig({ tokens: { ref }, plugins: dtcg({ outDir: "out" }) });
    const logger = { info() {}, warn() {}, error() {}, debug() {} };
    const result = await runPlugins(config, { root: "/project", logger });
    expect(result.files.map((f) => f.path)).toEqual(["out/tokens.tokens.json"]);
  });

  test("emits tokens.resolver.json and delta-only files for multi-axis themes", async () => {
    const ref = defineReferenceTokens({
      color: { white: tokens.color("#ffffff"), black: tokens.color("#000000") },
      spacing: { md: tokens.dimension("16px") },
    });
    const system = defineSystemTokens({ bg: ref.color.white });
    const dark = defineTheme(system, { bg: ref.color.black });
    const compact = defineTheme(ref, { spacing: { md: tokens.dimension("8px") } });
    const config = defineConfig({
      tokens: { ref, system },
      themes: {
        mode: defineThemeAxis({ default: "light", description: "Color mode", contexts: { dark } }),
        density: { compact },
      },
      plugins: dtcg({ outDir: "out" }),
    });
    const logger = { info() {}, warn() {}, error() {}, debug() {} };
    const result = await runPlugins(config, { root: "/project", logger });

    expect(result.files.map((f) => f.path)).toEqual([
      "out/tokens.tokens.json",
      "out/tokens.resolver.json",
      "out/themes/mode-dark.tokens.json",
      "out/themes/density-compact.tokens.json",
    ]);

    const resolver = generateDtcgResolver(config);
    expect(resolver).toEqual({
      $schema: "https://www.designtokens.org/schemas/2025.10/resolver.json",
      version: "2025.10",
      sets: { base: { sources: [{ $ref: "./tokens.tokens.json" }] } },
      modifiers: {
        mode: {
          description: "Color mode",
          default: "light",
          contexts: {
            light: [],
            dark: [{ $ref: "./themes/mode-dark.tokens.json" }],
          },
        },
        density: {
          default: "default",
          contexts: {
            default: [],
            compact: [{ $ref: "./themes/density-compact.tokens.json" }],
          },
        },
      },
      resolutionOrder: [
        { $ref: "#/sets/base" },
        { $ref: "#/modifiers/mode" },
        { $ref: "#/modifiers/density" },
      ],
    });

    // Delta contains only the overridden token, not untouched base tokens.
    const darkDelta = generateDtcgDelta(config.registry, dark);
    expect(darkDelta).toEqual({
      system: { bg: { $type: "color", $value: "{ref.color.black}" } },
    });
  });

  test("reports case-insensitive or cross-axis delta filename collisions", async () => {
    const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
    const ov = defineTheme(ref, { color: { black: tokens.color("#111111") } });
    const logger = { info() {}, warn() {}, error() {}, debug() {} };

    const caseClash = defineConfig({
      tokens: { ref },
      themes: { dark: ov, Dark: ov },
      plugins: dtcg({ outDir: "out" }),
    });
    const caseResult = await runPlugins(caseClash, { root: "/project", logger });
    expect(caseResult.files).toEqual([]);
    expect(caseResult.diagnostics[0]?.message).toMatch(/differ only by case/);

    const crossAxisClash = defineConfig({
      tokens: { ref },
      themes: { "a-b": { c: ov }, a: { "b-c": ov } },
      plugins: dtcg({ outDir: "out" }),
    });
    const crossResult = await runPlugins(crossAxisClash, { root: "/project", logger });
    expect(crossResult.files).toEqual([]);
    expect(crossResult.diagnostics[0]?.message).toContain("both write themes/a-b-c.tokens.json");
  });
});
