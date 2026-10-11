import { describe, expect, jest, test } from "@jest/globals";
import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "../src/index.js";
import {
  generateTypeScriptNativeFiles,
  type TypeScriptNativePluginOptions,
} from "../src/plugins/typescript-native.js";
import { assertParses, assertTypechecks, compositeConfig } from "./helpers/fixtures.js";
import type { Config, OutputFile } from "@recontentapp/core";

const NATIVE: TypeScriptNativePluginOptions = { outDir: "dist-test" };

function generate(config: Config, options: TypeScriptNativePluginOptions = NATIVE): OutputFile[] {
  return generateTypeScriptNativeFiles(config, options);
}

test("a group with a child named value keeps its siblings", () => {
  const ref = defineReferenceTokens({
    size: { value: tokens.dimension("1px"), large: tokens.dimension("2px") },
  });
  const config = defineConfig({
    tokens: { ref, system: defineSystemTokens({}), components: {} },
  });
  const [file] = generateTypeScriptNativeFiles(config, { outDir: "dist-test" });
  expect(file!.content).toMatch(/"large": 2,/);
  expect(file!.content).toMatch(/"value": 1,/);
});

describe("scalars", () => {
  test("dimension: px passes through, rem multiplies by rootFontSize (default 16), rounded to 4 decimals", () => {
    const ref = defineReferenceTokens({
      px: tokens.dimension("16px"),
      rem: tokens.dimension("1.5rem"),
      em: tokens.dimension("0.5em"),
    });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    const [file] = generate(config);
    expect(file!.content).toMatch(/"px": 16,/);
    expect(file!.content).toMatch(/"rem": 24,/);
    expect(file!.content).toMatch(/"em": 8,/);
  });

  test("duration: s multiplies by 1000", () => {
    const ref = defineReferenceTokens({
      ms: tokens.duration("175ms"),
      s: tokens.duration("0.2s"),
    });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    const [file] = generate(config);
    expect(file!.content).toMatch(/"ms": 175,/);
    expect(file!.content).toMatch(/"s": 200,/);
  });

  test("color emits an 8-digit hex when alpha < 1", () => {
    const ref = defineReferenceTokens({
      opaque: tokens.color("#0064e0"),
      translucent: tokens.color("#0171e333"),
    });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    const [file] = generate(config);
    expect(file!.content).toMatch(/"opaque": '#0064e0',/);
    expect(file!.content).toMatch(/"translucent": '#0171e333',/);
  });

  test("fontWeight is a string; cubicBezier is a tuple", () => {
    const ref = defineReferenceTokens({
      weight: tokens.fontWeight("bold"),
      bezier: tokens.cubicBezier([0.24, 1, 0.4, 1]),
    });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    const [file] = generate(config);
    expect(file!.content).toMatch(/"weight": '700',/);
    expect(file!.content).toMatch(/"bezier": \[0\.24, 1, 0\.4, 1\],/);
  });
});

describe("composites", () => {
  test("shadow: shape with shadowOpacity from alpha and a literal shadowColor", () => {
    const { config } = compositeConfig();
    const [file] = generate(config);
    expect(file!.content).toMatch(/"shadowColor": '#000000',/);
    expect(file!.content).toMatch(/"shadowOffset": \{\s*"width": 0,\s*"height": 2,\s*\},/);
    expect(file!.content).toMatch(/"shadowRadius": 4,/);
    expect(file!.content).toMatch(/"shadowOpacity": 1,/);
  });

  test("border shape", () => {
    const { config } = compositeConfig();
    const [file] = generate(config);
    expect(file!.content).toMatch(
      /"default": \{\s*"borderColor": themeRef\.color\.black,\s*"borderWidth": 1,\s*"borderStyle": 'solid',\s*\},/,
    );
  });

  test("transition uses duration/delay/timingFunction keys", () => {
    const { config } = compositeConfig();
    const [file] = generate(config);
    expect(file!.content).toMatch(
      /"standard": \{\s*"duration": 200,\s*"delay": 0,\s*"timingFunction": \[0\.4, 0, 0\.2, 1\],\s*\},/,
    );
  });

  test("gradient shape", () => {
    const { config } = compositeConfig();
    const [file] = generate(config);
    expect(file!.content).toMatch(/"kind": 'linear',/);
    expect(file!.content).toMatch(/"angle": '180deg',/);
    expect(file!.content).toMatch(
      /"stops": \[\{ color: themeRef\.color\.black, position: 0 \}, \{ color: '#ffffff', position: 1 \}\],/,
    );
  });

  test("typography: lineHeight is absolute px, rounded to 4 decimals, and always a literal", () => {
    const ref = defineReferenceTokens({
      typography: {
        base: tokens.typography({
          fontFamily: "Arial",
          fontSize: "14px",
          fontWeight: "regular",
          lineHeight: 1.4286,
        }),
      },
    });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    const [file] = generate(config);
    expect(file!.content).toMatch(/"lineHeight": 20\.0004,/);
  });

  test("typography lineHeight recomputes when a theme overrides fontSize", () => {
    const ref = defineReferenceTokens({ size: tokens.dimension("14px") });
    const system = defineSystemTokens({
      typography: {
        base: tokens.typography({
          fontFamily: "Arial",
          fontSize: ref.size,
          fontWeight: "regular",
          lineHeight: 2,
        }),
      },
    });
    const dark = defineTheme(ref, { size: tokens.dimension("20px") });
    const config = defineConfig({
      tokens: { ref, system, components: {} },
      themes: { dark },
    });
    const [file] = generate(config);
    const darkStart = file!.content.indexOf("const darkSystem");
    const darkBlock = file!.content.slice(darkStart, file!.content.indexOf("as const", darkStart));
    expect(darkBlock).toMatch(/"lineHeight": 40,/);
  });
});

describe("lossy warnings", () => {
  test("a second shadow layer is dropped and warned about, deduplicated across themes", () => {
    const warn = jest.spyOn(console, "error").mockImplementation(() => {});
    const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
    const system = defineSystemTokens({
      shadow: {
        double: tokens.shadow([
          { color: ref.color.black, offsetX: "0px", offsetY: "1px", blur: "2px", spread: "0px" },
          { color: ref.color.black, offsetX: "0px", offsetY: "2px", blur: "4px", spread: "0px" },
        ]),
      },
    });
    const dark = defineTheme(ref, { color: { black: tokens.color("#111111") } });
    const config = defineConfig({
      tokens: { ref, system, components: {} },
      themes: { dark },
    });
    generate(config);
    const shadowWarnings = warn.mock.calls.filter((call) =>
      String(call[0]).includes("only supports a single shadow"),
    );
    expect(shadowWarnings).toHaveLength(1);
    warn.mockRestore();
  });

  test("an unsupported strokeStyle falls back to solid and warns", () => {
    const warn = jest.spyOn(console, "error").mockImplementation(() => {});
    const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
    const system = defineSystemTokens({
      border: {
        odd: tokens.border({ color: ref.color.black, width: "1px", style: "groove" }),
      },
    });
    const config = defineConfig({
      tokens: { ref, system, components: {} },
    });
    const [file] = generate(config);
    expect(file!.content).toMatch(/"borderStyle": 'solid',/);
    expect(warn.mock.calls.some((call) => String(call[0]).includes("has no React Native"))).toBe(
      true,
    );
    warn.mockRestore();
  });
});

describe("rootFontSize option", () => {
  test("a custom rootFontSize changes rem conversion", () => {
    const ref = defineReferenceTokens({ rem: tokens.dimension("1rem") });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    const [file] = generate(config, { outDir: "dist-test", rootFontSize: 10 });
    expect(file!.content).toMatch(/"rem": 10,/);
  });
});

describe("parses and typechecks", () => {
  test("generated tokens.ts passes assertParses and assertTypechecks", () => {
    const { config } = compositeConfig();
    const [file] = generate(config);
    assertParses(file!.content);
    assertTypechecks(file!.content);
  });

  test("a hand-written RN TextStyle union accepts the generated fontWeight literal type", () => {
    const ref = defineReferenceTokens({
      typography: {
        base: tokens.typography({ fontFamily: "Arial", fontSize: "16px", fontWeight: "bold" }),
      },
    });
    const config = defineConfig({
      tokens: { ref, system: defineSystemTokens({}), components: {} },
    });
    const [file] = generate(config);
    const rnShim = `
type TextStyle = {
  fontWeight?:
    | "normal"
    | "bold"
    | "100"
    | "200"
    | "300"
    | "400"
    | "500"
    | "600"
    | "700"
    | "800"
    | "900";
};
const style: TextStyle = { fontWeight: theme.ref.typography.base.fontWeight };
`;
    assertTypechecks(`${file!.content}\n${rnShim}`);
  });

  test("generate returns exactly one tokens.ts", () => {
    const { config } = compositeConfig();
    const files = generate(config);
    expect(files.length).toBe(1);
    expect(files[0]!.filename).toBe("tokens.ts");
  });
});
