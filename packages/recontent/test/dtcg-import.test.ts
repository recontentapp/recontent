import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "@jest/globals";
import { generateConfigFromDtcg } from "../src/cli/dtcg-import/index.js";
import { assertParses } from "./helpers/fixtures.js";

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** Writes `files` (path -> JSON) into a fresh temp directory and returns it. */
function writeFiles(files: Record<string, unknown>): string {
  const dir = mkdtempSync(path.join(tmpdir(), "dtcg-import-"));
  dirs.push(dir);
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    writeFileSync(path.join(dir, name), JSON.stringify(content));
  }
  return dir;
}

function generate(files: Record<string, unknown>, sources: string[]) {
  const cwd = writeFiles(files);
  const result = generateConfigFromDtcg({ sources, cwd });
  assertParses(result.source, "recontent.config.ts");
  return result;
}

const white = { colorSpace: "srgb", components: [1, 1, 1], alpha: 1, hex: "#ffffff" };
const px = (value: number) => ({ value, unit: "px" });

describe("value conversion", () => {
  const { source, warnings, stats } = generate(
    {
      "tokens.json": {
        color: {
          $type: "color",
          hex: { $value: white },
          translucent: {
            $value: { colorSpace: "srgb", components: [0, 0, 0], alpha: 0.2, hex: "#000000" },
          },
          fractionalAlpha: {
            $value: { colorSpace: "srgb", components: [0, 0, 0], alpha: 0.132, hex: "#000000" },
          },
          fractional: {
            $value: { colorSpace: "srgb", components: [0.9, 0.9, 0.9], hex: "#e6e6e6" },
          },
          hsl: { $value: { colorSpace: "hsl", components: [217, 91, 60] } },
          legacy: { $value: "#ff8800" },
          outOfRange: { $value: { colorSpace: "hsl", components: [217, 191, 60] } },
          unknownSpace: { $value: { colorSpace: "cmyk", components: [0, 0, 0] } },
        },
        size: {
          $type: "dimension",
          rem: { $value: { value: 0.5, unit: "rem" } },
          em: { $value: { value: 0.02, unit: "em" } },
          string: { $value: "16px" },
          vw: { $value: { value: 5, unit: "vw" } },
          unitless: { $value: { value: 0, unit: "" } },
        },
        font: {
          stack: { $type: "fontFamily", $value: ["Inter", "system-ui"] },
          csv: { $type: "fontFamily", $value: '"Helvetica Neue", Arial' },
          named: { $type: "fontWeight", $value: "Bold" },
          numeric: { $type: "fontWeight", $value: 450 },
        },
        misc: {
          duration: { $type: "duration", $value: { value: 150, unit: "ms" } },
          bezier: { $type: "cubicBezier", $value: [0.4, 0, 0.2, 1] },
          number: { $type: "number", $value: 1.5 },
          stroke: { $type: "strokeStyle", $value: "dashed" },
          customStroke: {
            $type: "strokeStyle",
            $value: { dashArray: [px(4), px(2)], lineCap: "round" },
          },
          text: { $type: "string", $value: "hello" },
          custom: { $type: "custom-thing", $value: {} },
        },
      },
    },
    ["tokens.json"],
  );

  test("converts colors", () => {
    expect(source).toContain(`"hex": tokens.color('#ffffff')`);
    expect(source).toContain(`"translucent": tokens.color('#00000033')`);
    expect(source).toContain(
      `tokens.color({ colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.132 })`,
    );
    // Components that are not whole bytes would be rounded by a hex string.
    expect(source).toContain(`tokens.color({ colorSpace: 'srgb', components: [0.9, 0.9, 0.9] })`);
    expect(source).toContain(`tokens.color({ colorSpace: 'hsl', components: [217, 91, 60] })`);
    expect(source).toContain(`"legacy": tokens.color('#ff8800')`);
  });

  test("converts dimensions in px, rem and em", () => {
    expect(source).toContain(`"rem": tokens.dimension('0.5rem')`);
    expect(source).toContain(`"em": tokens.dimension('0.02em')`);
    expect(source).toContain(`"string": tokens.dimension('16px')`);
  });

  test("converts fonts, motion, numbers and stroke styles", () => {
    expect(source).toContain(`tokens.fontFamily('Inter, system-ui')`);
    expect(source).toContain(`tokens.fontFamily('"Helvetica Neue", Arial')`);
    expect(source).toContain(`tokens.fontWeight('bold')`);
    expect(source).toContain(`tokens.fontWeight(450)`);
    expect(source).toContain(`tokens.duration('150ms')`);
    expect(source).toContain(`tokens.cubicBezier([0.4, 0, 0.2, 1])`);
    expect(source).toContain(`tokens.number(1.5)`);
    expect(source).toContain(`tokens.strokeStyle('dashed')`);
    expect(source).toContain(`tokens.strokeStyle({ dashArray: ['4px', '2px'], lineCap: 'round' })`);
  });

  test("skips unsupported values with a warning each", () => {
    expect(warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`Skipped "color.outOfRange": color component 1 (191)`),
        expect.stringContaining(`Skipped "color.unknownSpace": unsupported color space "cmyk"`),
        expect.stringContaining(`Skipped "size.vw": unsupported dimension unit "vw"`),
        expect.stringContaining(`Skipped "size.unitless": unsupported dimension unit ""`),
        expect.stringContaining(`Skipped "misc.text": unsupported $type "string"`),
        expect.stringContaining(`Skipped "misc.custom": unsupported $type "custom-thing"`),
      ]),
    );
    expect(stats).toMatchObject({ ref: 18, system: 0, themes: 0, skipped: 6 });
    expect(source).not.toContain("outOfRange");
  });
});

describe("tokens, groups and metadata", () => {
  test("inherits $type from groups and maps $root", () => {
    const { source } = generate(
      {
        "tokens.json": {
          color: {
            $type: "color",
            brand: { $root: { $value: white }, light: { $value: white } },
            clash: { root: { $value: white }, $root: { $value: white } },
          },
        },
      },
      ["tokens.json"],
    );
    expect(source).toMatch(/"brand": \{\s+"light": [^\n]+\s+"root": tokens\.color\('#ffffff'\)/);
    expect(source).toMatch(/"clash": \{\s+"root": [^\n]+\s+"_root": /);
  });

  test("infers a missing $type from the value, or from the alias target", () => {
    const { source, warnings } = generate(
      {
        "tokens.json": {
          bare: { $value: white },
          size: { $value: px(4) },
          alias: { $value: "{bare}" },
        },
      },
      ["tokens.json"],
    );
    expect(source).toContain(`"bare": tokens.color('#ffffff')`);
    expect(source).toContain(`"size": tokens.dimension('4px')`);
    expect(source).toContain(`"alias": ref.bare`);
    expect(warnings).toEqual([expect.stringContaining("Inferred a missing $type")]);
  });

  test("renames token names recontent rejects", () => {
    const { source, warnings } = generate(
      {
        "tokens.json": {
          "a{b}": { $type: "number", $value: 1 },
          constructor: { $type: "number", $value: 2 },
        },
      },
      ["tokens.json"],
    );
    expect(source).toContain(`"a_b_": tokens.number(1)`);
    expect(source).toContain(`"constructor_": tokens.number(2)`);
    expect(warnings).toHaveLength(2);
  });

  test("keeps descriptions and deprecations, drops extensions", () => {
    const { source } = generate(
      {
        "tokens.json": {
          a: {
            $type: "number",
            $value: 1,
            $description: "It's a number.",
            $deprecated: true,
            $extensions: { "com.example": { noisy: true } },
          },
          b: { $type: "number", $value: 2, $deprecated: "Use a." },
        },
      },
      ["tokens.json"],
    );
    expect(source).toContain(`tokens.number(1).describe('It\\'s a number.').deprecate()`);
    expect(source).toContain(`tokens.number(2).deprecate('Use a.')`);
    expect(source).not.toContain("noisy");
  });
});

describe("aliases and layers", () => {
  const files = {
    "tokens.json": {
      color: {
        $type: "color",
        white: { $value: white },
        black: { $value: { ...white, hex: "#000000", components: [0, 0, 0] } },
      },
      space: { $type: "dimension", small: { $value: px(4) } },
      font: { $type: "fontFamily", sans: { $value: ["Inter"] } },
      surface: {
        $type: "color",
        page: { $value: "{color.white}" },
        card: { $value: "{surface.page}" },
        panel: { $value: "{surface.card}" },
        missing: { $value: "{color.nope}" },
        wrongType: { $value: "{space.small}" },
        loopA: { $value: "{surface.loopB}" },
        loopB: { $value: "{surface.loopA}" },
      },
      text: {
        $type: "typography",
        body: {
          $value: {
            fontFamily: "{font.sans}",
            fontSize: "{space.small}",
            fontWeight: 400,
            WebkitFontSmoothing: "antialiased",
          },
        },
        label: { $value: "{text.body}" },
      },
      shadow: {
        $type: "shadow",
        card: {
          $value: {
            color: "{color.black}",
            offsetX: px(0),
            offsetY: "{space.small}",
            blur: px(4),
            spread: px(0),
          },
        },
      },
    },
  };
  const { source, warnings, stats } = generate(files, ["tokens.json"]);

  test("puts literals in ref and aliasing tokens in system", () => {
    expect(source).toMatch(/const ref = defineReferenceTokens\(\{\s+"color": \{/);
    expect(source).toMatch(/const system = defineSystemTokens\(\{\s+"surface": \{/);
    expect(stats).toMatchObject({ ref: 4, system: 6 });
  });

  test("collapses alias chains to the final ref token", () => {
    expect(source).toContain(`"page": ref.color.white`);
    expect(source).toContain(`"card": ref.color.white`);
    expect(source).toContain(`"panel": ref.color.white`);
  });

  test("resolves composite members to ref and inlines composite aliases", () => {
    const body = `tokens.typography({ fontFamily: ref.font.sans, fontSize: ref.space.small, fontWeight: 400 })`;
    expect(source).toContain(`"body": ${body}`);
    expect(source).toContain(`"label": ${body}`);
    expect(source).toContain(
      `tokens.shadow({ color: ref.color.black, offsetX: '0px', offsetY: ref.space.small, blur: '4px', spread: '0px' })`,
    );
    expect(warnings).toContain("Dropped unsupported typography properties: WebkitFontSmoothing.");
  });

  test("skips tokens with missing, mistyped or circular aliases", () => {
    expect(warnings).toEqual(
      expect.arrayContaining([
        `Skipped "surface.missing": alias target "{color.nope}" does not exist.`,
        `Skipped "surface.wrongType": "{space.small}" is dimension, expected color.`,
        expect.stringContaining(`Skipped "surface.loopA": circular alias`),
      ]),
    );
    expect(stats.skipped).toBe(4);
  });
});

describe("sources", () => {
  const resolver = (modifiers: Record<string, unknown>, order: string[]) => ({
    $schema: "https://www.designtokens.org/schemas/2025.10/resolver.json",
    version: "2025.10",
    resolutionOrder: order.map((name) => ({ $ref: name })),
    sets: { base: { sources: [{ $ref: "./base.tokens.json" }] } },
    modifiers,
  });
  const base = {
    color: { $type: "color", bg: { $value: white }, fg: { $value: "{color.bg}" } },
    space: { $type: "dimension", gap: { $value: px(4) } },
  };
  const black = { colorSpace: "srgb", components: [0, 0, 0], alpha: 1, hex: "#000000" };

  test("names a theme after its context when there is one modifier", () => {
    const { source, stats, warnings } = generate(
      {
        "r.resolver.json": resolver(
          {
            theme: {
              contexts: {
                light: [{ color: { $type: "color", bg: { $value: white } } }],
                dark: [{ color: { $type: "color", bg: { $value: black } } }],
              },
              default: "light",
            },
          },
          ["#/sets/base", "#/modifiers/theme"],
        ),
        "base.tokens.json": base,
      },
      ["r.resolver.json"],
    );
    expect(stats.themes).toBe(1);
    expect(source).toContain(`"dark": defineTheme(`);
    expect(source).toContain(`"bg": tokens.color('#000000')`);
    // fg follows ref.color.bg, which the theme overrides: nothing more to emit.
    expect(source.match(/tokens\.color\('#000000'\)/g)).toHaveLength(1);
    expect(warnings).toEqual([]);
  });

  test("prefixes the modifier when there are several, and defaults to the first context", () => {
    const { source, warnings } = generate(
      {
        "r.resolver.json": resolver(
          {
            theme: {
              contexts: { light: [], dark: [{ color: { $type: "color", bg: { $value: black } } }] },
            },
            density: {
              contexts: {
                roomy: [],
                tight: [{ space: { $type: "dimension", gap: { $value: px(2) } } }],
              },
              default: "roomy",
            },
          },
          ["#/sets/base", "#/modifiers/theme", "#/modifiers/density"],
        ),
        "base.tokens.json": base,
      },
      ["r.resolver.json"],
    );
    expect(source).toContain(`"theme-dark": defineTheme(`);
    expect(source).toContain(`"density-tight": defineTheme(`);
    expect(warnings).toEqual([
      'Modifier "theme" has no default context; using its first context "light".',
    ]);
  });

  test("merges a default context into the base, including paths only it defines", () => {
    const { source, stats } = generate(
      {
        "r.resolver.json": resolver(
          {
            theme: {
              contexts: {
                light: [{ theme: { $type: "color", surface: { $value: "{color.bg}" } } }],
                dark: [{ theme: { $type: "color", surface: { $value: "{color.fg}" } } }],
              },
              default: "light",
            },
          },
          ["#/sets/base", "#/modifiers/theme"],
        ),
        "base.tokens.json": base,
      },
      ["r.resolver.json"],
    );
    expect(source).toContain(`"theme": {\n    "surface": ref.color.bg`);
    expect(stats.themes).toBe(1);
    expect(source).toMatch(/system: \{\s+"theme": \{\s+"surface": tokens\.color\('#ffffff'\)/);
  });

  test("overrides a system alias with a literal and updates the aliases collapsed through it", () => {
    const { source } = generate(
      {
        "r.resolver.json": resolver(
          {
            theme: {
              contexts: {
                light: [],
                dark: [{ color: { $type: "color", fg: { $value: black }, bg: { $value: black } } }],
              },
              default: "light",
            },
          },
          ["#/sets/base", "#/modifiers/theme"],
        ),
        "base.tokens.json": {
          ...base,
          surface: { $type: "color", a: { $value: "{color.fg}" }, b: { $value: "{surface.a}" } },
        },
      },
      ["r.resolver.json"],
    );
    // color.fg is a system alias; surface.a and surface.b collapsed to ref.color.bg
    // would never see its new value without their own overrides.
    const dark = source.slice(source.indexOf(`"dark"`));
    expect(dark).toMatch(
      /"surface": \{\s+"a": tokens\.color\('#000000'\),\s+"b": tokens\.color\('#000000'\)/,
    );
  });

  test("warns about overrides that have no base token or a different type", () => {
    const { warnings, stats } = generate(
      {
        "r.resolver.json": resolver(
          {
            theme: {
              contexts: {
                light: [],
                dark: [
                  {
                    color: {
                      $type: "color",
                      bg: { $value: black },
                      extra: { $type: "color", $value: black },
                    },
                    space: { gap: { $type: "number", $value: 3 } },
                  },
                ],
              },
              default: "light",
            },
          },
          ["#/sets/base", "#/modifiers/theme"],
        ),
        "base.tokens.json": base,
      },
      ["r.resolver.json"],
    );
    expect(warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`"color.extra" does not exist in the base tokens`),
        expect.stringContaining(`"space.gap" is number but the base token is dimension`),
      ]),
    );
    expect(stats.skipped).toBe(2);
  });

  test("ignores sets that are not in the resolution order", () => {
    const { warnings } = generate(
      {
        "r.resolver.json": resolver({}, []),
        "base.tokens.json": base,
      },
      ["r.resolver.json"],
    );
    expect(warnings).toContain('Set "base" is not part of resolutionOrder; ignoring it.');
  });

  test("merges files in order, warns on conflicting values and creates no themes", () => {
    const { source, warnings, stats } = generate(
      {
        "a.tokens.json": { gap: { $type: "dimension", $value: px(4) } },
        "b.tokens.json": {
          gap: { $type: "dimension", $value: px(8) },
          pad: { $type: "dimension", $value: px(1) },
        },
      },
      ["a.tokens.json", "b.tokens.json"],
    );
    expect(source).toContain(`"gap": tokens.dimension('8px')`);
    expect(warnings).toEqual([
      expect.stringContaining('Token "gap" is defined with different values'),
    ]);
    expect(stats.themes).toBe(0);
  });

  test("expands a directory to its sorted *.tokens.json files", () => {
    const { source } = generate(
      {
        "tokens/b.tokens.json": { b: { $type: "number", $value: 2 } },
        "tokens/nested/a.tokens.json": { a: { $type: "number", $value: 1 } },
        "tokens/ignored.json": { c: { $type: "number", $value: 3 } },
      },
      ["tokens"],
    );
    expect(source).toContain(`"b": tokens.number(2)`);
    expect(source).toContain(`"a": tokens.number(1)`);
    expect(source).not.toContain(`"c"`);
  });

  test("rejects JSON pointers in token values and missing sources", () => {
    const { warnings } = generate(
      { "tokens.json": { a: { $type: "number", $value: { $ref: "#/b/$value" } } } },
      ["tokens.json"],
    );
    expect(warnings).toEqual([expect.stringContaining(`Skipped "a": uses a $ref JSON pointer`)]);

    const cwd = writeFiles({});
    expect(() => generateConfigFromDtcg({ sources: ["nope.json"], cwd })).toThrow(/does not exist/);
  });
});
