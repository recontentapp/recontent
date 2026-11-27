import ts from "typescript";
import { describe, expect, test } from "@jest/globals";
import {
  defineComponentTokens,
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  defineThemeAxis,
  tokens,
} from "../../src/index.js";
import {
  generateTypeScriptFiles,
  type TypeScriptPluginOptions,
} from "../../src/plugins/typescript.js";
import {
  assertParses,
  assertTypechecks,
  aliasChainConfig,
  compositeConfig,
  refOnlyConfig,
  scaleConfig,
  themedConfig,
  withAlias,
  type Fixture,
} from "../helpers/fixtures.js";
import type { Config } from "../../src/config/types.js";
import type { OutputFile } from "../../src/plugins/shared/context.js";

const TS: TypeScriptPluginOptions = { outDir: "dist-test" };

function generate(config: Config, options: TypeScriptPluginOptions = TS): OutputFile[] {
  return generateTypeScriptFiles(config, options);
}

test("filename renames the output, so it can share an outDir with typescriptNative", () => {
  const { config } = aliasChainConfig();
  expect(generate(config, { ...TS, filename: "web-tokens.ts" })[0]!.filename).toBe("web-tokens.ts");
  expect(generate(config)[0]!.filename).toBe("tokens.ts");
});

describe("scalars", () => {
  test("color/dimension/duration/cubicBezier/fontFamily are CSS strings", () => {
    const ref = defineReferenceTokens({
      color: tokens.color("#000000"),
      dim: tokens.dimension("16px"),
      dur: tokens.duration("175ms"),
      bezier: tokens.cubicBezier([0.24, 1, 0.4, 1]),
      family: tokens.fontFamily("Arial, sans-serif"),
    });
    const config = refOnlyConfig(ref);
    const [file] = generate(config);
    expect(file!.content).toMatch(/"color": '#000000',/);
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
    const config = refOnlyConfig(ref);
    const [file] = generate(config);
    expect(file!.content).toMatch(/"weight": 700,/);
    expect(file!.content).toMatch(/"ratio": 1\.4286,/);
  });
});

describe("tree shape", () => {
  test("a group with a child named value keeps its siblings", () => {
    const ref = defineReferenceTokens({
      size: { value: tokens.dimension("1px"), large: tokens.dimension("2px") },
    });
    const config = refOnlyConfig(ref);
    const [file] = generate(config);
    expect(file!.content).toMatch(/"large": '2px',/);
    expect(file!.content).toMatch(/"value": '1px',/);
  });
});

describe("alias roots", () => {
  test("system and components (full path, no stripped layer prefix) terminate at the ref const, not an intermediate system const", () => {
    const { config } = aliasChainConfig();
    const [file] = generate(config);
    expect(file!.content).toMatch(/const themeRef = \{/);
    expect(file!.content).toMatch(/"accent": themeRef\.color\.black,/);
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
    const config = withAlias(refOnlyConfig(ref), "ref.color.alias", "ref.color.base");
    const [file] = generate(config);
    const themeRefBlock = file!.content.slice(0, file!.content.indexOf("themeSystem"));
    expect(themeRefBlock).toMatch(/"alias": '#000000',/);
    expect(themeRefBlock).not.toMatch(/"alias": themeRef\.color\.base,/);
  });

  test("a theme alias references the earlier layer's const in that theme", () => {
    const { config } = themedConfig({ layer: "system", alias: true });
    const [file] = generate(config);
    const start = file!.content.indexOf("const darkSystem");
    const block = file!.content.slice(start, file!.content.indexOf("as const", start));
    expect(block).toMatch(/"accent": darkRef\.color\.white,/);
  });

  test("a same-layer alias to an overridden token inlines the override value", () => {
    const { config } = themedConfig({ layer: "ref" });
    withAlias(config, "ref.color.alias", "ref.color.black");
    const [file] = generate(config);
    const darkStart = file!.content.indexOf("const darkRef");
    const darkBlock = file!.content.slice(darkStart, file!.content.indexOf("as const", darkStart));
    expect(darkBlock).toMatch(/"black": '#111111',/);
    expect(darkBlock).toMatch(/"alias": '#111111',/);
  });
});

describe("scales and files", () => {
  test("scale exports are rooted at theme. with non-identifier keys quoted", () => {
    const { config } = scaleConfig();
    const [file] = generate(config);
    expect(file!.content).toMatch(/export type RefSpacing = 0 \| 1 \| "0-5";/);
    expect(file!.content).toMatch(/export const refSpacing = theme\.ref\.spacing;/);
  });
});

describe("identifier guards", () => {
  test.each(["theme", "themeRef"])("a theme named %s collides with a reserved export", (name) => {
    const { config } = themedConfig({ layer: "ref", name });
    expect(() => generate(config)).toThrow(
      `identifier "${name}" collides with a reserved export name`,
    );
  });

  test("duplicate scale typeName throws, naming both paths", () => {
    const ref = defineReferenceTokens({
      spacing: tokens.dimensionScale({ 0: "0px", 1: "4px" }),
      "spacing!": tokens.dimensionScale({ 0: "0px", 1: "4px" }),
    });
    expect(() => generate(refOnlyConfig(ref))).toThrow(
      /Scale export name "RefSpacing" collides between token paths/,
    );
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

  test("multi-axis resolveTheme typechecks strictly and resolves cross-axis aliases in resolutionOrder", () => {
    const ref = defineReferenceTokens({
      color: {
        brand: tokens.color("#2563eb"),
        alt: tokens.color("#7c3aed"),
        bg: tokens.color("#ffffff"),
      },
    });
    const system = defineSystemTokens({
      accent: ref.color.brand,
      surface: ref.color.bg,
    });
    const components = defineComponentTokens({
      button: { bg: system.accent },
    });
    const acme = defineTheme(
      { ref, system },
      {
        ref: { color: { alt: tokens.color("#db2777") } },
        system: { surface: tokens.color("#f5f5f5") },
      },
    );
    const dark = defineTheme(system, {
      accent: ref.color.alt,
      surface: tokens.color("#111111"),
    });
    const config = defineConfig({
      tokens: { ref, system, components },
      themes: {
        brand: defineThemeAxis({ default: "core", contexts: { acme } }),
        mode: defineThemeAxis({ default: "light", contexts: { dark } }),
      },
    });

    const [file] = generate(config);
    assertParses(file!.content);
    assertTypechecks(
      `${file!.content}\nconst resolved: Theme = resolveTheme({ brand: "acme", mode: "dark" });\nvoid resolved;\n`,
    );

    const cjs = ts.transpileModule(file!.content, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const exportsObj: Record<string, any> = {};
    new Function("exports", cjs)(exportsObj);

    expect(exportsObj.resolveTheme().components.button.bg).toBe("#2563eb");
    // mode=dark aliases system.accent -> ref.color.alt, which brand=acme overrides to #db2777.
    expect(exportsObj.resolveTheme({ brand: "acme", mode: "dark" }).components.button.bg).toBe(
      "#db2777",
    );
    // Later axis (`mode`) wins on system.surface.
    expect(exportsObj.resolveTheme({ brand: "acme" }).system.surface).toBe("#f5f5f5");
    expect(exportsObj.resolveTheme({ brand: "acme", mode: "dark" }).system.surface).toBe("#111111");
  });

  test("multi-axis resolves strokeStyle dashArray aliases and upward cross-layer aliases without unused params", () => {
    const ref = defineReferenceTokens({
      dash: tokens.dimension("4px"),
      selection: tokens.color("#000000"),
    });
    const system = defineSystemTokens({
      stroke: tokens.strokeStyle({ dashArray: [ref.dash, "2px"], lineCap: "round" }),
      base: tokens.color("#111111"),
    });
    // Upward alias: ref token aliasing a system token overridden by an axis.
    const refWithUpward = defineReferenceTokens({
      dash: tokens.dimension("4px"),
      mirrored: system.base,
    });
    const compact = defineTheme(refWithUpward, { dash: tokens.dimension("2px") });
    const dark = defineTheme(system, { base: tokens.color("#222222") });
    const config = defineConfig({
      tokens: { ref: refWithUpward, system, components: {} },
      themes: { density: { compact }, mode: { dark } },
    });

    const [file] = generate(config);
    assertParses(file!.content);
    assertTypechecks(file!.content);

    const cjs = ts.transpileModule(file!.content, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const exportsObj: Record<string, any> = {};
    new Function("exports", cjs)(exportsObj);

    expect(exportsObj.resolveTheme().system.stroke).toBe("dashed");
    expect(exportsObj.resolveTheme({ mode: "dark" }).ref.mirrored).toBe("#222222");

    // A token named `selection` must not trick `buildRef` into leaving an unused `selection` param.
    const staticConfig = defineConfig({
      tokens: { ref, system: defineSystemTokens({ a: ref.selection }), components: {} },
      themes: {
        a: { a1: defineTheme(system, {}) },
        b: { b1: defineTheme(system, {}) },
      },
    });
    const [staticFile] = generate(staticConfig);
    expect(staticFile!.content).toContain("function buildRef(_selection: ThemeSelection)");
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
    const config = refOnlyConfig(ref);
    const [file] = generate(config);
    const content = file!.content;
    const doc = "/**\n * Spacing scale\n * @deprecated Use system.spacing\n */\n";
    expect(content).toContain(`${doc}export type RefSpacing = 0 | 1;`);
    expect(content).toContain(`${doc}export const refSpacing = theme.ref.spacing;`);
    expect(content).toContain("/**\n * @deprecated\n */\nexport type RefDeprecatedOnly");
    expect(content).not.toMatch(/\*\/\nexport type RefPlain/);
    expect(content).toMatch(/\n\nexport type RefPlain/);
  });

  test("prototype property names like toString are emitted safely without mutating Object.prototype", () => {
    const ref = defineReferenceTokens({
      toString: { primary: tokens.color("#112233") },
    });
    const [file] = generate(refOnlyConfig(ref));
    expect(file!.content).toContain('"toString"');
    expect(file!.content).toContain("'#112233'");
    expect("primary" in Object.prototype.toString).toBe(false);
    assertParses(file!.content);
    assertTypechecks(file!.content);
  });
});
