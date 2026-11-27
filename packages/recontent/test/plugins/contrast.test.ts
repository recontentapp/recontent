import { describe, expect, test } from "@jest/globals";
import type { PluginContext, PluginDiagnostic } from "../../src/plugins/types.js";
import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "../../src/index.js";
import { contrast } from "../../src/plugins/contrast.js";

function ctxOf(config: ReturnType<typeof defineConfig>): PluginContext {
  return {
    registry: config.registry,
    groups: config.groups,
    themes: config.themes,
    root: "/project",
    logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
  };
}

type System = ReturnType<typeof defineSystemTokens>;
type Theme = ReturnType<typeof defineTheme>;

async function run(
  options: Parameters<typeof contrast>[0],
  system: System,
  dark?: Theme,
): Promise<PluginDiagnostic[]> {
  const config = defineConfig({
    tokens: { ref: defineReferenceTokens({}), system },
    ...(dark && { themes: { dark } }),
  });
  return contrast(options).validate!(ctxOf(config));
}

const pair = (text: string, surface: string) =>
  defineSystemTokens({ text: tokens.color(text), surface: tokens.color(surface) });

const rule = { foreground: "system.text", background: "system.surface" };

describe("ratio", () => {
  test.each([
    ["#000000", "#ffffff", 0],
    ["#767676", "#ffffff", 0],
    ["#777777", "#ffffff", 1],
  ])("%s on %s yields %i diagnostics", async (fg, bg, count) => {
    expect(await run({ rules: [rule] }, pair(fg, bg))).toHaveLength(count);
  });

  test("a failing ratio is reported with the foreground path and two decimals", async () => {
    expect(await run({ rules: [rule] }, pair("#777777", "#ffffff"))).toEqual([
      {
        severity: "error",
        path: ["system", "text"],
        message:
          "system.text on system.surface has contrast 4.48:1 in the base tokens, below 4.5:1.",
      },
    ]);
  });
});

describe("groups", () => {
  test("a rule between two groups checks the full matrix and ignores non-colors", async () => {
    const system = defineSystemTokens({
      fg: { a: tokens.color("#777777"), b: tokens.color("#888888"), size: tokens.number(1) },
      bg: { a: tokens.color("#ffffff"), b: tokens.color("#fefefe") },
    });
    const found = await run(
      { rules: [{ foreground: "system.fg", background: "system.bg" }] },
      system,
    );
    expect(found.map((d) => d.message.split(" has")[0])).toEqual([
      "system.fg.a on system.bg.a",
      "system.fg.a on system.bg.b",
      "system.fg.b on system.bg.a",
      "system.fg.b on system.bg.b",
    ]);
  });

  test("a token on both sides is not paired with itself", async () => {
    const system = defineSystemTokens({
      c: { a: tokens.color("#777777"), b: tokens.color("#ffffff") },
    });
    const found = await run(
      { rules: [{ foreground: "system.c", background: "system.c" }] },
      system,
    );
    // a on b and b on a: 2 pairs, never a on a.
    expect(found.map((d) => d.message.split(" has")[0])).toEqual([
      "system.c.a on system.c.b",
      "system.c.b on system.c.a",
    ]);
  });
});

describe("themes", () => {
  test("a pair that passes in the base tokens but fails in a theme is reported once", async () => {
    const system = pair("#000000", "#ffffff");
    const dark = defineTheme(system, { surface: tokens.color("#222222") });
    expect((await run({ rules: [rule] }, system, dark)).map((d) => d.message)).toEqual([
      'system.text on system.surface has contrast 1.32:1 in theme "dark", below 4.5:1.',
    ]);
  });

  test("an override anywhere along an alias chain is picked up", async () => {
    const ref = defineReferenceTokens({ color: { bg: tokens.color("#ffffff") } });
    const system = defineSystemTokens({
      text: tokens.color("#000000"),
      surface: ref.color.bg,
    });
    const dark = defineTheme(ref, { color: { bg: tokens.color("#111111") } });
    const config = defineConfig({
      tokens: { ref, system },
      themes: { dark },
    });
    const found = await contrast({ rules: [rule] }).validate!(ctxOf(config));
    expect(found.map((d) => d.message)).toEqual([
      'system.text on system.surface has contrast 1.11:1 in theme "dark", below 4.5:1.',
    ]);
  });

  test("checks combinations of color-affecting axes while skipping non-color axes", async () => {
    const ref = defineReferenceTokens({ gap: tokens.dimension("8px") });
    const system = defineSystemTokens({
      text: tokens.color("#111111"),
      surface: tokens.color("#ffffff"),
      spacing: ref.gap,
    });
    const acme = defineTheme(system, { text: tokens.color("#666666") }); // 5.74:1 on #fff (passes), 1.85:1 on #333 (fails)
    const dark = defineTheme(system, { surface: tokens.color("#dddddd") }); // #111 on #ddd is 12.6:1 (passes), #666 on #ddd is 4.26:1 (fails!)
    const compact = defineTheme(ref, { gap: tokens.dimension("4px") });

    const config = defineConfig({
      tokens: { ref, system },
      themes: { brand: { acme }, mode: { dark }, density: { compact } },
    });
    const found = await contrast({ rules: [rule] }).validate!(ctxOf(config));
    // Only fails in the combined `brand=acme, mode=dark` state, reported once (not duplicated by `density=compact`).
    expect(found.map((d) => d.message)).toEqual([
      'system.text on system.surface has contrast 4.23:1 in theme "brand=acme, mode=dark", below 4.5:1.',
    ]);
  });

  test("unrelated color axes do not duplicate diagnostics for a failing pair", async () => {
    const system = defineSystemTokens({
      text: tokens.color("#000000"),
      surface: tokens.color("#ffffff"),
      accent: tokens.color("#2563eb"),
    });
    const dark = defineTheme(system, { text: tokens.color("#888888") });
    const red = defineTheme(system, { accent: tokens.color("#dc2626") });
    const green = defineTheme(system, { accent: tokens.color("#16a34a") });
    const config = defineConfig({
      tokens: { ref: defineReferenceTokens({}), system },
      themes: {
        mode: { dark },
        accent: { red, green },
      },
    });
    const found = await contrast({ rules: [rule] }).validate!(ctxOf(config));
    expect(found.map((d) => d.message)).toEqual([
      'system.text on system.surface has contrast 3.54:1 in theme "mode=dark", below 4.5:1.',
    ]);
  });
});

describe("alpha", () => {
  test("a translucent foreground is composited over the background", async () => {
    const system = defineSystemTokens({
      text: tokens.color("#000000").alpha(0.5),
      surface: tokens.color("#ffffff"),
    });
    const [found] = await run({ rules: [rule] }, system);
    expect(found?.message).toContain("3.98:1");
  });

  test("a translucent background is an error", async () => {
    const system = defineSystemTokens({
      text: tokens.color("#000000"),
      surface: tokens.color("#ffffff").alpha(0.5),
    });
    const found = await run({ rules: [rule] }, system);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ severity: "error" });
    expect(found[0]!.message).toContain("must be opaque");
  });
});

describe("rules", () => {
  test("a key matching no color token is one error", async () => {
    const found = await run(
      { rules: [{ foreground: "system.nope", background: "system.surface" }] },
      pair("#000000", "#ffffff"),
    );
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ severity: "error" });
    expect(found[0]!.message).toContain('"system.nope"');
  });

  test("severity and min are respected", async () => {
    const found = await run(
      {
        rules: [
          { ...rule, min: 3, severity: "warning" },
          { ...rule, min: 7 },
          { ...rule, min: 3 },
        ],
      },
      pair("#777777", "#ffffff"),
    );
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ severity: "error" });
    expect(found[0]!.message).toContain("below 7:1");
  });
});
