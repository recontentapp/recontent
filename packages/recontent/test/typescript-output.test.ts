import { describe, expect, test } from "@jest/globals";
import {
  defineComponentTokens,
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "../src/index.js";
import {
  generateTypeScriptFiles,
  type TypeScriptPluginOptions,
} from "../src/outputs/typescript.js";
import {
  assertParses,
  assertTypechecks,
  aliasChainConfig,
  compositeConfig,
  scaleConfig,
  themedConfig,
  type Fixture,
} from "./helpers/fixtures.js";
import type { Config, OutputFile } from "@recontentapp/core";

const TS: TypeScriptPluginOptions = { outDir: "dist-test" };

function generate(config: Config, options: TypeScriptPluginOptions = TS): OutputFile[] {
  return generateTypeScriptFiles(config, options);
}

describe("scalars", () => {
  test("fontWeight and number are emitted as bare numbers", () => {
    const { config } = aliasChainConfig();
    const [file] = generate(config);
    expect(file!.content).toMatch(/"black": '#000000',/);
  });

  test("color/dimension/duration/cubicBezier/fontFamily are CSS strings", () => {
    const ref = defineReferenceTokens({
      dim: tokens.dimension("16px"),
      dur: tokens.duration("175ms"),
      bezier: tokens.cubicBezier([0.24, 1, 0.4, 1]),
      family: tokens.fontFamily("Arial, sans-serif"),
    });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    const [file] = generate(config);
    expect(file!.content).toMatch(/"dim": '16px',/);
    expect(file!.content).toMatch(/"dur": '175ms',/);
    expect(file!.content).toMatch(/"bezier": 'cubic-bezier\(0\.24, 1, 0\.4, 1\)',/);
    expect(file!.content).toMatch(/"family": 'Arial, sans-serif',/);
  });

  test("fontWeight is a bare number and number is a bare number", () => {
    const ref = defineReferenceTokens({
      weight: tokens.fontWeight("bold"),
      ratio: tokens.number(1.4286),
    });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    const [file] = generate(config);
    expect(file!.content).toMatch(/"weight": 700,/);
    expect(file!.content).toMatch(/"ratio": 1\.4286,/);
  });
});

describe("alias roots", () => {
  test("system references themeRef; components (full path, no stripped layer prefix) also terminate at themeRef", () => {
    const { config } = aliasChainConfig();
    const [file] = generate(config);
    expect(file!.content).toMatch(/const themeRef = \{/);
    expect(file!.content).toMatch(/"accent": themeRef\.color\.black,/);
    expect(file!.content).toMatch(/"background": themeRef\.color\.black,/);
  });

  test("a 3-hop alias chain resolves to the terminal ref const, not the intermediate system const", () => {
    const { config } = aliasChainConfig();
    const [file] = generate(config);
    expect(file!.content).toMatch(/"background": themeRef\.color\.black,/);
    expect(file!.content).not.toMatch(/"background": themeSystem\.colors\.accent,/);
    expect(file!.content).not.toMatch(/"background": '#000000',/);
  });
});

describe("composites", () => {
  test("typography is a nested object keyed by cssProperty", () => {
    const { config } = compositeConfig();
    const [file] = generate(config);
    expect(file!.content).toMatch(/"body": \{\s*"fontFamily": themeRef\.fontFamily\.body,/);
  });

  test("an inline shadow with an aliased member emits a template literal", () => {
    const { config } = compositeConfig();
    const [file] = generate(config);
    expect(file!.content).toMatch(/"card": `0px 2px 4px 0px \$\{themeRef\.color\.black\}`,/);
  });

  test("an entry-level composite alias references the whole node", () => {
    const ref = defineReferenceTokens({
      typography: {
        base: tokens.typography({ fontFamily: "Arial", fontSize: "16px", fontWeight: "regular" }),
      },
    });
    const system = defineSystemTokens({ typography: { body: ref.typography.base } });
    const config = defineConfig({
      tokens: { ref, system, components: {} },
    });
    const [file] = generate(config);
    expect(file!.content).toMatch(/"body": themeRef\.typography\.base,/);
  });
});

describe("theme blocks", () => {
  test("an overridden ref token becomes a literal in that theme's tree", () => {
    const { config } = themedConfig({ layer: "ref" });
    const [file] = generate(config);
    const darkStart = file!.content.indexOf("const darkRef");
    const darkBlock = file!.content.slice(darkStart, file!.content.indexOf("as const", darkStart));
    expect(darkBlock).toMatch(/"black": '#111111',/);
  });

  test("a system token aliasing an overridden ref token references darkRef", () => {
    const { config } = themedConfig({ layer: "ref" });
    const [file] = generate(config);
    const darkStart = file!.content.indexOf("const darkSystem");
    const darkBlock = file!.content.slice(darkStart, file!.content.indexOf("as const", darkStart));
    expect(darkBlock).toMatch(/"accent": darkRef\.color\.black,/);
  });

  test("a system token overridden directly is a literal; components alias it via darkSystem", () => {
    const { config } = themedConfig({ layer: "system" });
    const [file] = generate(config);
    const systemStart = file!.content.indexOf("const darkSystem");
    const systemBlock = file!.content.slice(
      systemStart,
      file!.content.indexOf("as const", systemStart),
    );
    expect(systemBlock).toMatch(/"accent": '#111111',/);
    const componentsStart = file!.content.indexOf("const darkComponents");
    const componentsBlock = file!.content.slice(
      componentsStart,
      file!.content.indexOf("as const", componentsStart),
    );
    expect(componentsBlock).toMatch(/"background": darkSystem\.colors\.accent,/);
  });
});

describe("same-layer aliases", () => {
  test("a same-layer alias is inlined as a literal", () => {
    const ref = defineReferenceTokens({ color: { base: tokens.color("#000000") } });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    config.registry.set("ref.color.alias", {
      path: ["ref", "color", "alias"],
      $type: "color",
      $value: ref.color.base.$value,
      alias: ["ref", "color", "base"],
      layer: "ref",
    });
    const [file] = generate(config);
    const themeRefBlock = file!.content.slice(0, file!.content.indexOf("themeSystem"));
    expect(themeRefBlock).toMatch(/"alias": '#000000',/);
    expect(themeRefBlock).not.toMatch(/"alias": themeRef\.color\.base,/);
  });

  test("a same-layer alias to an overridden token inlines the override value", () => {
    const ref = defineReferenceTokens({ color: { base: tokens.color("#000000") } });
    const dark = defineTheme(ref, { color: { base: tokens.color("#111111") } });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
      themes: { dark },
    });
    config.registry.set("ref.color.alias", {
      path: ["ref", "color", "alias"],
      $type: "color",
      $value: ref.color.base.$value,
      alias: ["ref", "color", "base"],
      layer: "ref",
    });
    const [file] = generate(config);
    const darkStart = file!.content.indexOf("const darkRef");
    const darkBlock = file!.content.slice(darkStart, file!.content.indexOf("as const", darkStart));
    expect(darkBlock).toMatch(/"base": '#111111',/);
    expect(darkBlock).toMatch(/"alias": '#111111',/);
  });
});

describe("errors", () => {
  test("a circular alias throws", () => {
    const a = defineReferenceTokens({ color: { a: tokens.color("#000000") } });
    const config = defineConfig({
      tokens: { ref: a, system: defineSystemTokens({}), components: {} },
    });
    config.registry.set("ref.color.a", {
      path: ["ref", "color", "a"],
      $type: "color",
      $value: a.color.a.$value,
      alias: ["ref", "color", "b"],
      layer: "ref",
    });
    config.registry.set("ref.color.b", {
      path: ["ref", "color", "b"],
      $type: "color",
      $value: a.color.a.$value,
      alias: ["ref", "color", "a"],
      layer: "ref",
    });
    expect(() => generate(config)).toThrow(/Circular alias detected at token path: ref\.color\./);
  });

  test("a missing alias target throws", () => {
    const a = defineReferenceTokens({ color: { a: tokens.color("#000000") } });
    const config = defineConfig({
      tokens: { ref: a, system: defineSystemTokens({}), components: {} },
    });
    config.registry.set("ref.color.a", {
      path: ["ref", "color", "a"],
      $type: "color",
      $value: a.color.a.$value,
      alias: ["ref", "color", "missing"],
      layer: "ref",
    });
    expect(() => generate(config)).toThrow("Alias target not found: ref.color.missing");
  });
});

describe("scales and files", () => {
  test("scale exports are rooted at theme. with non-identifier keys quoted", () => {
    const { config } = scaleConfig();
    const [file] = generate(config);
    expect(file!.content).toMatch(/export type RefSpacing = 0 \| 1 \| "0-5";/);
    expect(file!.content).toMatch(/export const refSpacing = theme\.ref\.spacing;/);
  });

  test("generate returns exactly one tokens.ts", () => {
    const { config } = aliasChainConfig();
    const files = generate(config);
    expect(files.length).toBe(1);
    expect(files[0]!.filename).toBe("tokens.ts");
  });

  test("themes/ThemeName/Theme/BaseTheme are exported", () => {
    const { config } = aliasChainConfig();
    const [file] = generate(config);
    expect(file!.content).toMatch(/export const themes = \{ theme \} as const;/);
    expect(file!.content).toMatch(/export type ThemeName = keyof typeof themes;/);
    expect(file!.content).toMatch(/export type Theme = \(typeof themes\)\[ThemeName\];/);
    expect(file!.content).toMatch(/export type BaseTheme = typeof theme;/);
  });
});

describe("parses and typechecks", () => {
  test("every generated tokens.ts in this suite passes assertParses and assertTypechecks", () => {
    const fixtures: Fixture[] = [
      aliasChainConfig(),
      compositeConfig(),
      scaleConfig(),
      themedConfig({ layer: "ref" }),
      themedConfig({ layer: "system" }),
      themedConfig({ layer: "components" }),
    ];
    for (const { config } of fixtures) {
      const [file] = generate(config);
      assertParses(file!.content);
      assertTypechecks(file!.content);
    }
  });

  test("component built-in options are not accepted by the typescript output type", () => {
    const options: TypeScriptPluginOptions = {
      outDir: "dist-test",
      // @ts-expect-error builtInComponents does not exist on TypeScriptPluginOptions
      builtInComponents: {},
    };
    const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
    const config = defineConfig({
      tokens: {
        ref,
        system: defineSystemTokens({}),
        components: defineComponentTokens({}),
      },
    });
    const [file] = generate(config, options);
    assertTypechecks(file!.content);
  });
});

describe("scale metadata", () => {
  test("scale exports carry a JSDoc block with description and @deprecated", () => {
    const ref = defineReferenceTokens({
      spacing: tokens
        .dimensionScale({ 0: "0px", 1: "4px" })
        .describe("Spacing scale")
        .deprecate("Use system.spacing"),
      deprecatedOnly: tokens.numberScale({ a: 1 }).deprecate(),
      plain: tokens.numberScale({ a: 1 }),
    });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    const [file] = generate(config);
    const content = file!.content;
    const doc = "/**\n * Spacing scale\n * @deprecated Use system.spacing\n */\n";
    expect(content).toContain(`${doc}export type RefSpacing = 0 | 1;`);
    expect(content).toContain(`${doc}export const refSpacing = theme.ref.spacing;`);
    expect(content).toContain("/**\n * @deprecated\n */\nexport type RefDeprecatedOnly");
    expect(content).not.toMatch(/\*\/\nexport type RefPlain/);
    expect(content).toMatch(/\n\nexport type RefPlain/);
  });
});
