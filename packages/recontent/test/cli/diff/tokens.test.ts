import { expect, test } from "@jest/globals";
import type { Config } from "../../../src/config/types.js";
import type {
  ThemeAxis,
  ThemeOverride,
  ThemeValue,
  TokenEntry,
  TokenRegistry,
} from "../../../src/token-model/registry.js";
import { diffConfigs, hasBreakingChanges } from "../../../src/cli/commands/diff/tokens.js";
import { countBreakingChanges, formatDiff } from "../../../src/cli/commands/diff/format.js";

function entry(path: string[], overrides: Partial<TokenEntry> = {}): TokenEntry {
  return {
    path,
    $type: "color",
    $value: { colorSpace: "srgb", components: [0, 0, 0], alpha: 1, hex: "#000000" },
    layer: "ref",
    ...overrides,
  };
}

function themed(hex: string): ThemeValue {
  return { $value: color(hex) };
}

function color(hex: string) {
  return {
    colorSpace: "srgb" as const,
    components: [0, 0, 0] as [number, number, number],
    alpha: 1,
    hex,
  };
}

function config(
  registry: TokenRegistry,
  themes: Record<string, ThemeOverride> | ThemeAxis[] = [],
): Config {
  const normalizedThemes: ThemeAxis[] = Array.isArray(themes)
    ? themes
    : Object.keys(themes).length === 0
      ? []
      : [{ name: "theme", default: "default", contexts: themes }];
  return {
    registry,
    groups: new Map(),
    diagnostics: [],
    themes: normalizedThemes,
    plugins: [],
    logLevel: "info",
  };
}

test("diffConfigs reports a straight add", () => {
  const base = config(new Map());
  const head = config(new Map([["ref.color.blue", entry(["ref", "color", "blue"])]]));
  const diff = diffConfigs(base, head);
  expect(diff.added).toHaveLength(1);
  expect(diff.removed).toHaveLength(0);
  expect(diff.renamed).toHaveLength(0);
  expect(hasBreakingChanges(diff)).toBe(false);
});

test("a token with the same type and value in another layer is not a rename", () => {
  const base = config(new Map([["ref.color.blue", entry(["ref", "color", "blue"])]]));
  const head = config(
    new Map([["system.accent", entry(["system", "accent"], { layer: "system" })]]),
  );
  const diff = diffConfigs(base, head);
  expect(diff.renamed).toHaveLength(0);
  expect(diff.removed).toHaveLength(1);
  expect(diff.added).toHaveLength(1);
});

test("diffConfigs reports a straight remove", () => {
  const base = config(new Map([["ref.color.blue", entry(["ref", "color", "blue"])]]));
  const head = config(new Map());
  const diff = diffConfigs(base, head);
  expect(diff.removed).toHaveLength(1);
  expect(diff.added).toHaveLength(0);
  expect(hasBreakingChanges(diff)).toBe(true);
});

test("diffConfigs pairs a same type+value token under a new path as a rename", () => {
  const base = config(
    new Map([
      ["ref.color.blue600", entry(["ref", "color", "blue600"], { $value: color("#0064e0") })],
    ]),
  );
  const head = config(
    new Map([
      ["ref.color.brand600", entry(["ref", "color", "brand600"], { $value: color("#0064e0") })],
    ]),
  );
  const diff = diffConfigs(base, head);
  expect(diff.renamed).toHaveLength(1);
  expect(diff.renamed[0]!.from.path).toEqual(["ref", "color", "blue600"]);
  expect(diff.renamed[0]!.to.path).toEqual(["ref", "color", "brand600"]);
  expect(diff.added).toHaveLength(0);
  expect(diff.removed).toHaveLength(0);
  expect(hasBreakingChanges(diff)).toBe(true);
});

test("diffConfigs reports a retype", () => {
  const base = config(
    new Map([
      [
        "system.spacing.md",
        entry(["system", "spacing", "md"], {
          $type: "dimension",
          $value: { value: 4, unit: "px" },
        }),
      ],
    ]),
  );
  const head = config(
    new Map([
      [
        "system.spacing.md",
        entry(["system", "spacing", "md"], { $type: "number", $value: { value: 4 } }),
      ],
    ]),
  );
  const diff = diffConfigs(base, head);
  expect(diff.retyped).toHaveLength(1);
  expect(diff.retyped[0]!.from.$type).toBe("dimension");
  expect(diff.retyped[0]!.to.$type).toBe("number");
  expect(hasBreakingChanges(diff)).toBe(true);
});

test("diffConfigs reports a value change", () => {
  const base = config(
    new Map([
      ["ref.color.blue500", entry(["ref", "color", "blue500"], { $value: color("#2694fe") })],
    ]),
  );
  const head = config(
    new Map([
      ["ref.color.blue500", entry(["ref", "color", "blue500"], { $value: color("#1e88ff") })],
    ]),
  );
  const diff = diffConfigs(base, head);
  expect(diff.changed).toHaveLength(1);
  expect(diff.changed[0]!.from.$value).toEqual(color("#2694fe"));
  expect(diff.changed[0]!.to.$value).toEqual(color("#1e88ff"));
  expect(hasBreakingChanges(diff)).toBe(false);
});

test("diffConfigs leaves an ambiguous rename group as separate add+remove", () => {
  const base = config(
    new Map([
      ["ref.color.a", entry(["ref", "color", "a"], { $value: color("#000000") })],
      ["ref.color.b", entry(["ref", "color", "b"], { $value: color("#000000") })],
    ]),
  );
  const head = config(
    new Map([
      ["ref.color.c", entry(["ref", "color", "c"], { $value: color("#000000") })],
      ["ref.color.d", entry(["ref", "color", "d"], { $value: color("#000000") })],
    ]),
  );
  const diff = diffConfigs(base, head);
  expect(diff.renamed).toHaveLength(0);
  expect(diff.added).toHaveLength(2);
  expect(diff.removed).toHaveLength(2);
});

test("diffConfigs reports theme override added/removed/changed", () => {
  const registry: TokenRegistry = new Map([
    ["ref.color.black", entry(["ref", "color", "black"], { $value: color("#000000") })],
  ]);
  const baseTheme: ThemeOverride = new Map([
    ["ref.color.removedOverride", themed("#111111")],
    ["ref.color.changedOverride", themed("#222222")],
  ]);
  const headTheme: ThemeOverride = new Map([
    ["ref.color.changedOverride", themed("#333333")],
    ["ref.color.addedOverride", themed("#444444")],
  ]);
  const base = config(registry, { dark: baseTheme });
  const head = config(registry, { dark: headTheme });
  const diff = diffConfigs(base, head);
  expect(diff.themes.changedAxes.theme?.changedContexts.dark).toBeDefined();
  expect(diff.themes.changedAxes.theme!.changedContexts.dark!.added).toHaveLength(1);
  expect(diff.themes.changedAxes.theme!.changedContexts.dark!.removed).toHaveLength(1);
  expect(diff.themes.changedAxes.theme!.changedContexts.dark!.changed).toHaveLength(1);
});

test("formatDiff lists the overrides that changed in a theme, with their values", () => {
  const registry: TokenRegistry = new Map([
    ["ref.color.bg", entry(["ref", "color", "bg"])],
    ["ref.color.fg", entry(["ref", "color", "fg"])],
    ["ref.color.line", entry(["ref", "color", "line"])],
  ]);
  const base = config(registry, {
    dark: new Map([
      ["ref.color.bg", themed("#111111")],
      ["ref.color.fg", themed("#eeeeee")],
    ]),
  });
  const head = config(registry, {
    dark: new Map([
      ["ref.color.bg", themed("#222222")],
      ["ref.color.line", { $value: color("#333333"), alias: ["ref", "color", "bg"] }],
    ]),
  });
  const output = formatDiff({ tokens: diffConfigs(base, head) });
  expect(output).toContain("- `dark`");
  expect(output).toContain("**changed** `ref.color.bg`: #111111 -> #222222");
  expect(output).toContain("**added** `ref.color.line`: alias -> ref.color.bg");
  expect(output).toContain("**removed** `ref.color.fg` (was #eeeeee)");
});

test("formatDiff shows the alpha and color space of a color change", () => {
  const withColor = (value: TokenEntry["$value"]) =>
    config(new Map([["ref.color.shadow", entry(["ref", "color", "shadow"], { $value: value })]]));
  const output = formatDiff({
    tokens: diffConfigs(
      withColor({ colorSpace: "srgb", components: [0, 0, 0], alpha: 0.125, hex: "#000000" }),
      withColor({ colorSpace: "oklch", components: [0.5, 0.1, 250], alpha: 0.5, hex: "#4b5f9c" }),
    ),
  });
  expect(output).toContain("- #00000020");
  expect(output).toContain("+ oklch(0.5 0.1 250 / 0.5)");
});

test("formatDiff reports no changes for an identical config", () => {
  const registry: TokenRegistry = new Map([
    ["ref.color.black", entry(["ref", "color", "black"], { $value: color("#000000") })],
  ]);
  const diff = diffConfigs(config(registry), config(registry));
  expect(formatDiff({ tokens: diff })).toMatch(/No changes between the working tree and HEAD/);
});

test("formatDiff shows human-readable values, not raw JSON, for a scalar change", () => {
  const base = config(
    new Map([
      [
        "ref.fontSize.base",
        entry(["ref", "fontSize", "base"], {
          $type: "dimension",
          $value: { value: 14, unit: "px" },
        }),
      ],
    ]),
  );
  const head = config(
    new Map([
      [
        "ref.fontSize.base",
        entry(["ref", "fontSize", "base"], {
          $type: "dimension",
          $value: { value: 16, unit: "px" },
        }),
      ],
    ]),
  );
  const output = formatDiff({ tokens: diffConfigs(base, head) });
  expect(output).toContain("ref.fontSize.base");
  expect(output).toContain("- 14px");
  expect(output).toContain("+ 16px");
  expect(output).not.toContain('"value"');
});

test("formatDiff reports only the nested member that changed inside a composite token", () => {
  const typographyValue = (fontSizePx: number) => ({
    fontFamily: { $value: { value: ["Arial"] } },
    fontSize: {
      $value: { value: fontSizePx, unit: "px" as const },
      alias: ["ref", "fontSize", "base"],
    },
    fontWeight: { $value: { value: 400 } },
    letterSpacing: { $value: { value: 0, unit: "px" as const } },
    lineHeight: { $value: { value: 1.4 } },
  });

  const registry = (fontSizePx: number): TokenRegistry =>
    new Map([
      [
        "system.textStyles.body",
        entry(["system", "textStyles", "body"], {
          $type: "typography",
          layer: "system",
          $value: typographyValue(fontSizePx) as never,
        }),
      ],
    ]);

  const diff = diffConfigs(config(registry(14)), config(registry(16)));
  expect(diff.changed).toHaveLength(1);

  const output = formatDiff({ tokens: diff });
  expect(output).toContain("system.textStyles.body.fontSize");
  expect(output).toContain("- 14px");
  expect(output).toContain("+ 16px");
  expect(output).not.toContain("fontFamily");
  expect(output).not.toContain('"value"');
});

test("formatDiff renders markdown sections with a fenced diff block by default", () => {
  const base = config(
    new Map([
      ["ref.color.red", entry(["ref", "color", "red"], { $value: color("#ff0000") })],
      ["ref.color.blue", entry(["ref", "color", "blue"], { $value: color("#0000ff") })],
    ]),
  );
  const head = config(
    new Map([
      ["ref.color.blue", entry(["ref", "color", "blue"], { $value: color("#0000fe") })],
      ["ref.color.green", entry(["ref", "color", "green"], { $value: color("#00ff00") })],
    ]),
  );
  const output = formatDiff({ tokens: diffConfigs(base, head) });
  expect(output).toBe(formatDiff({ tokens: diffConfigs(base, head) }, "markdown"));
  expect(output).toContain("## Breaking (1)");
  expect(output).toContain("- **removed** `ref.color.red`");
  expect(output).toContain("## Added (1)");
  expect(output).toContain("- `ref.color.green`");
  expect(output).toContain(
    "## Changed (1)\n\n```diff\n# ref.color.blue\n- #0000ff\n+ #0000fe\n```",
  );
});

test("formatDiff json is the raw diff plus its comparison context, a breaking verdict and counts", () => {
  const registry: TokenRegistry = new Map([
    ["ref.color.black", entry(["ref", "color", "black"], { $value: color("#000000") })],
  ]);
  const context = { config: "recontent.config.ts", rev: "HEAD" };
  const json = (base: Config, head: Config) =>
    JSON.parse(formatDiff({ tokens: diffConfigs(base, head) }, "json", context));

  const unchanged = json(config(registry), config(registry));
  expect(unchanged).toMatchObject({ ...context, breaking: false });
  expect(unchanged.tokens.added).toEqual([]);

  const added = json(config(new Map()), config(registry));
  expect(added.tokens.added).toHaveLength(1);
  expect(added.tokens.added[0].path).toEqual(["ref", "color", "black"]);
  expect(added.breaking).toBe(false);

  const removed = json(config(registry), config(new Map()));
  expect(removed.breaking).toBe(true);
  expect(removed.counts).toEqual({
    tokens: { added: 0, removed: 1, renamed: 0, retyped: 0, changed: 0, metadata: 0, breaking: 1 },
    breaking: 1,
  });
});

test("formatDiff names the compared revision when nothing changed", () => {
  const diff = diffConfigs(config(new Map()), config(new Map()));
  expect(
    formatDiff({ tokens: diff }, "markdown", { config: "recontent.config.ts", rev: "origin/main" }),
  ).toBe("No changes between the working tree and origin/main.");
});

test("diffConfigs counts removed axes and contexts as breaking, and tracks default and order changes", () => {
  const override = (keys: string[]): ThemeOverride =>
    new Map(keys.map((key) => [key, themed("#000000")]));
  const registry: TokenRegistry = new Map();

  const removedAxis = diffConfigs(config(registry, { dark: override(["a"]) }), config(registry));
  expect(removedAxis.themes.removedAxes).toEqual(["theme"]);
  expect(hasBreakingChanges(removedAxis)).toBe(true);
  expect(formatDiff({ tokens: removedAxis })).toContain("**removed themes**");

  const removedContext = diffConfigs(
    config(registry, { dark: override(["a"]), light: override(["a"]) }),
    config(registry, { dark: override(["a"]) }),
  );
  expect(removedContext.themes.changedAxes.theme!.removedContexts).toEqual(["light"]);
  expect(hasBreakingChanges(removedContext)).toBe(true);
  expect(formatDiff({ tokens: removedContext })).toContain("**removed theme** `light`");

  const removedOverride = diffConfigs(
    config(registry, { dark: override(["a", "b"]) }),
    config(registry, { dark: override(["a"]) }),
  );
  expect(removedOverride.themes.changedAxes.theme!.changedContexts.dark!.removed).toHaveLength(1);
  expect(hasBreakingChanges(removedOverride)).toBe(false);
  expect(formatDiff({ tokens: removedOverride })).toContain("**removed** `b`");

  const reorderedAxes = diffConfigs(
    config(registry, [
      { name: "brand", default: "core", contexts: { acme: override(["a"]) } },
      { name: "mode", default: "light", contexts: { dark: override(["a"]) } },
    ]),
    config(registry, [
      { name: "mode", default: "day", contexts: { dark: override(["a"]) } },
      { name: "brand", default: "core", contexts: { acme: override(["a"]) } },
    ]),
  );
  expect(hasBreakingChanges(reorderedAxes)).toBe(false);
  expect(reorderedAxes.themes.orderChanged).toEqual({
    from: ["brand", "mode"],
    to: ["mode", "brand"],
  });
  expect(reorderedAxes.themes.changedAxes.mode?.defaultChanged).toEqual({
    from: "light",
    to: "day",
  });
  const md = formatDiff({ tokens: reorderedAxes });
  expect(md).toContain("**resolution order**: `brand`, `mode` -> `mode`, `brand`");
  expect(md).toContain("**default**: `light` -> `day`");

  // Adding the first flat theme names the theme context rather than the implicit "theme" axis.
  const firstFlatTheme = diffConfigs(config(registry), config(registry, { dark: override(["a"]) }));
  expect(formatDiff({ tokens: firstFlatTheme })).toContain("- `dark`: added");

  // Multi-axis config with an axis named "theme" keeps the axis qualifier even when only it changes.
  const multiNamedTheme = diffConfigs(
    config(registry, [
      { name: "theme", default: "default", contexts: { dark: override(["a"]) } },
      { name: "density", default: "normal", contexts: { compact: override(["b"]) } },
    ]),
    config(registry, [
      { name: "theme", default: "default", contexts: { highContrast: override(["a"]) } },
      { name: "density", default: "normal", contexts: { compact: override(["b"]) } },
    ]),
  );
  const multiMd = formatDiff({ tokens: multiNamedTheme });
  expect(multiMd).toContain("**removed theme context** `theme=dark`");
  expect(multiMd).toContain("- axis `theme`");
});

test("diffConfigs does not report an alias that only follows a renamed token", () => {
  const base = config(
    new Map([
      ["ref.color.blue600", entry(["ref", "color", "blue600"], { $value: color("#0064e0") })],
      [
        "system.color.accent",
        entry(["system", "color", "accent"], {
          layer: "system",
          $value: color("#0064e0"),
          alias: ["ref", "color", "blue600"],
        }),
      ],
    ]),
  );
  const head = config(
    new Map([
      ["ref.color.brand600", entry(["ref", "color", "brand600"], { $value: color("#0064e0") })],
      [
        "system.color.accent",
        entry(["system", "color", "accent"], {
          layer: "system",
          $value: color("#0064e0"),
          alias: ["ref", "color", "brand600"],
        }),
      ],
    ]),
  );
  const diff = diffConfigs(base, head);
  expect(diff.renamed).toHaveLength(1);
  expect(diff.changed).toHaveLength(0);
});

test("renaming a token that a theme overrides is one breaking change, not two", () => {
  const dark = (key: string) => ({ dark: new Map([[key, themed("#111111")]]) });
  const base = config(
    new Map([["ref.color.blue", entry(["ref", "color", "blue"])]]),
    dark("ref.color.blue"),
  );
  const head = config(
    new Map([["ref.color.azure", entry(["ref", "color", "azure"])]]),
    dark("ref.color.azure"),
  );

  const diff = diffConfigs(base, head);

  expect(diff.renamed).toHaveLength(1);
  expect(diff.themes.changedAxes).toEqual({});
  expect(countBreakingChanges({ tokens: diff })).toBe(1);
});

test("removing a token that a theme overrides is one breaking change, not two", () => {
  const base = config(new Map([["ref.color.blue", entry(["ref", "color", "blue"])]]), {
    dark: new Map([["ref.color.blue", themed("#111111")]]),
  });
  const head = config(new Map(), { dark: new Map() });

  const diff = diffConfigs(base, head);

  expect(diff.removed).toHaveLength(1);
  expect(diff.themes.changedAxes).toEqual({});
  expect(countBreakingChanges({ tokens: diff })).toBe(1);
});

test("diffConfigs reports a changed deprecation or description, and nothing else", () => {
  const base = config(new Map([["ref.color.blue", entry(["ref", "color", "blue"])]]));
  const head = config(
    new Map([
      [
        "ref.color.blue",
        entry(["ref", "color", "blue"], { $deprecated: true, $description: "Blue." }),
      ],
    ]),
  );

  const diff = diffConfigs(base, head);

  expect(diff.metadata).toHaveLength(1);
  expect(diff.changed).toHaveLength(0);
  expect(hasBreakingChanges(diff)).toBe(false);
  expect(formatDiff({ tokens: diff })).toContain(
    "`ref.color.blue`: now deprecated, description changed",
  );
});
