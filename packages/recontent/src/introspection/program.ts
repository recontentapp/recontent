import fs from "node:fs";
import path from "node:path";
import type { IntrospectionConfigInput } from "@recontentapp/core";
import ts from "typescript";

function formatDiagnostic(diagnostic: ts.Diagnostic): string {
  return ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
}

/** The two files an introspection starts from, resolved from the config. */
export function resolveInputs(
  config: IntrospectionConfigInput,
  root: string,
): { entry: string; tsconfigPath: string } {
  const entry = path.resolve(root, config.entry);
  if (!fs.existsSync(entry)) {
    throw new Error(`introspection.entry not found: "${entry}".`);
  }

  const tsconfigPath = config.tsconfig
    ? path.resolve(root, config.tsconfig)
    : ts.findConfigFile(path.dirname(entry), ts.sys.fileExists, "tsconfig.json");
  if (!tsconfigPath || !fs.existsSync(tsconfigPath)) {
    throw new Error(
      config.tsconfig
        ? `introspection.tsconfig not found: "${tsconfigPath}".`
        : `No tsconfig.json found above "${entry}". Set introspection.tsconfig.`,
    );
  }
  return { entry, tsconfigPath };
}

/**
 * Parsed `SourceFile`s by path and parse options, kept for the life of the process. A fresh
 * `ts.createCompilerHost` re-reads and re-parses every file, which makes
 * TypeScript treat each one as changed and defeats `oldProgram`; handing back
 * the same object for an unchanged file is what lets a watch rebuild reuse it.
 */
const sourceFiles = new Map<string, { mtime: number; file: ts.SourceFile }>();

function createCachingHost(options: ts.CompilerOptions): ts.CompilerHost {
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersionOrOptions, onError, shouldCreateNewSourceFile) => {
    // The same file can be parsed differently, e.g. as ESM and as CJS, depending on who imports it.
    const parse =
      typeof languageVersionOrOptions === "number"
        ? { languageVersion: languageVersionOrOptions }
        : languageVersionOrOptions;
    const key = [
      fileName,
      parse.languageVersion,
      parse.impliedNodeFormat,
      options.moduleDetection,
    ].join("\0");
    const mtime = ts.sys.getModifiedTime?.(fileName)?.getTime();
    const cached = sourceFiles.get(key);
    if (cached && !shouldCreateNewSourceFile && cached.mtime === mtime) return cached.file;
    const file = getSourceFile(
      fileName,
      languageVersionOrOptions,
      onError,
      shouldCreateNewSourceFile,
    );
    if (file && mtime !== undefined) sourceFiles.set(key, { mtime, file });
    return file;
  };
  return host;
}

export function createIntrospectionProgram(options: {
  entry: string;
  tsconfigPath: string;
  oldProgram?: ts.Program;
}): { program: ts.Program; configFiles: string[] } {
  const { entry, tsconfigPath } = options;
  const source = ts.readJsonConfigFile(tsconfigPath, ts.sys.readFile);
  const parsed = ts.parseJsonSourceFileConfigFileContent(
    source,
    ts.sys,
    path.dirname(tsconfigPath),
  );
  if (parsed.errors.length > 0) {
    throw new Error(`${tsconfigPath}: ${parsed.errors.map(formatDiagnostic).join("\n")}`);
  }

  // A solution-style tsconfig (`files: []` plus references) would otherwise
  // be silently applied with none of the options its project files set.
  const included = parsed.fileNames.some((name) => path.resolve(name) === entry);
  if (!included) {
    throw new Error(
      `introspection.entry "${entry}" is not included by "${tsconfigPath}". Set introspection.tsconfig to the tsconfig that covers it.`,
    );
  }

  const compilerOptions: ts.CompilerOptions = {
    ...parsed.options,
    jsx: parsed.options.jsx ?? ts.JsxEmit.ReactJSX,
    allowJs: true,
    skipLibCheck: true,
    noEmit: true,
  };
  const program = ts.createProgram({
    rootNames: [entry],
    options: compilerOptions,
    host: createCachingHost(compilerOptions),
    oldProgram: options.oldProgram,
  });
  return { program, configFiles: [tsconfigPath, ...(source.extendedSourceFiles ?? [])] };
}
