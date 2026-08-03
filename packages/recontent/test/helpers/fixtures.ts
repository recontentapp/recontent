import type { Config, ThemeOverride } from "@recontentapp/core";
import ts from "typescript";
import {
  defineComponentTokens,
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
  type OutputInput,
} from "../../src/index.js";

const VE: OutputInput = { target: "vanilla-extract", outDir: "dist-test" };

/**
 * Parses generated vanilla-extract source with the TS parser and asserts it
 * has no syntax errors - catches quoting/escaping regressions the content
 * regexes in individual tests would miss.
 */
export function assertParses(source: string, fileName = "tokens.css.ts"): void {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.ESNext, true);
  const diagnostics = (file as unknown as { parseDiagnostics?: readonly unknown[] })
    .parseDiagnostics;
  if (diagnostics && diagnostics.length > 0) {
    throw new Error(
      `Generated source failed to parse:\n${JSON.stringify(diagnostics, null, 2)}\n\n${source}`,
    );
  }
}

const libCache = new Map<string, ts.SourceFile>();

const TYPECHECK_COMPILER_OPTIONS: ts.CompilerOptions = {
  strict: true,
  noEmit: true,
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  skipLibCheck: true,
};

/**
 * Typechecks generated source in-memory (no disk I/O, no module resolution -
 * generated files are import-free). Catches use-before-declaration
 * (TS2448/2454) and duplicate-identifier (TS2300) bugs in the alias-ordering
 * algorithm that assertParses (syntax-only) cannot see.
 */
export function assertTypechecks(source: string, fileName = "tokens.ts"): void {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.ESNext, true);

  const host: ts.CompilerHost = {
    getSourceFile(name, languageVersion) {
      if (name === fileName) return sourceFile;
      const cached = libCache.get(name);
      if (cached) return cached;
      const text = ts.sys.readFile(name);
      if (text === undefined) return undefined;
      const lib = ts.createSourceFile(name, text, languageVersion, true);
      libCache.set(name, lib);
      return lib;
    },
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    writeFile: () => {},
    getCurrentDirectory: () => "/",
    getCanonicalFileName: (name) => name,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => "\n",
    fileExists: (name) => name === fileName || ts.sys.fileExists(name),
    readFile: (name) => (name === fileName ? source : ts.sys.readFile(name)),
    directoryExists: (name) => ts.sys.directoryExists(name),
    getDirectories: (name) => ts.sys.getDirectories(name),
  };

  const program = ts.createProgram([fileName], TYPECHECK_COMPILER_OPTIONS, host);
  const diagnostics = [
    ...program.getSyntacticDiagnostics(sourceFile),
    ...program.getSemanticDiagnostics(sourceFile),
  ];

  if (diagnostics.length > 0) {
    const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCurrentDirectory: () => "/",
      getCanonicalFileName: (name) => name,
      getNewLine: () => "\n",
    });
    throw new Error(`Generated source failed to typecheck:\n${formatted}\n\n${source}`);
  }
}

/**
 * A 3-hop alias chain: component -> system -> ref, all resolving to the same
 * color. Exercises reference preservation across every layer.
 */
export function aliasChainConfig(output: OutputInput = VE): Config {
  const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
  const system = defineSystemTokens({ colors: { accent: ref.color.black } });
  const components = defineComponentTokens({ button: { background: system.colors.accent } });

  return defineConfig({
    tokens: { ref, system, components },
    output,
  });
}

/**
 * One token of each of the 5 composite types (shadow, border, transition,
 * gradient, typography), each aliasing a ref color/fontFamily where relevant.
 */
export function compositeConfig(output: OutputInput = VE): Config {
  const ref = defineReferenceTokens({
    color: { black: tokens.color("#000000") },
    fontFamily: { body: tokens.fontFamily("Arial") },
  });
  const system = defineSystemTokens({
    shadow: {
      card: tokens.shadow({
        color: ref.color.black,
        offsetX: "0px",
        offsetY: "2px",
        blur: "4px",
        spread: "0px",
      }),
    },
    border: {
      default: tokens.border({ color: ref.color.black, width: "1px" }),
    },
    transition: {
      standard: tokens.transition({ duration: "200ms", timingFunction: [0.4, 0, 0.2, 1] }),
    },
    gradient: {
      accent: tokens.gradient({
        stops: [
          { color: ref.color.black, position: 0 },
          { color: "#ffffff", position: 1 },
        ],
      }),
    },
    typography: {
      body: tokens.typography({
        fontFamily: ref.fontFamily.body,
        fontSize: "16px",
        fontWeight: "regular",
      }),
    },
  });

  return defineConfig({
    tokens: { ref, system, components: {} },
    output,
  });
}

/**
 * A dimensionScale with a non-identifier key ("0-5") and a colorScale with a
 * numeric key (200), both at the ref layer.
 */
export function scaleConfig(output: OutputInput = VE): Config {
  const ref = defineReferenceTokens({
    spacing: tokens.dimensionScale({ 0: "0px", "0-5": "2px", 1: "4px" }),
    colors: tokens.colorScale({ 100: "#111111", 200: "#222222" }),
  });

  return defineConfig({
    tokens: { ref, system: defineSystemTokens({}), components: {} },
    output,
  });
}

/**
 * The same 3-hop alias chain as aliasChainConfig(), plus a "dark" theme
 * overriding the requested layer's token in the chain.
 */
export function themedConfig(options: {
  layer: "ref" | "system" | "components";
  output?: OutputInput;
}): Config {
  const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
  const system = defineSystemTokens({ colors: { accent: ref.color.black } });
  const components = defineComponentTokens({ button: { background: system.colors.accent } });

  let dark: ThemeOverride;
  if (options.layer === "ref") {
    dark = defineTheme(ref, { color: { black: tokens.color("#111111") } });
  } else if (options.layer === "system") {
    dark = defineTheme(system, { colors: { accent: tokens.color("#111111") } });
  } else {
    dark = defineTheme(components, { button: { background: tokens.color("#111111") } });
  }

  return defineConfig({
    tokens: { ref, system, components },
    themes: { dark },
    output: options.output ?? VE,
  });
}
