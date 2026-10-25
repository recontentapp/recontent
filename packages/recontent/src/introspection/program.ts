import fs from "node:fs";
import path from "node:path";
import type { IntrospectionConfigInput } from "@recontentapp/core";
import ts from "typescript";

function formatDiagnostic(diagnostic: ts.Diagnostic): string {
  return ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
}

export function createIntrospectionProgram(options: {
  config: IntrospectionConfigInput;
  root: string;
  oldProgram?: ts.Program;
}): { program: ts.Program; entry: string } {
  const entry = path.resolve(options.root, options.config.entry);
  if (!fs.existsSync(entry)) {
    throw new Error(`introspection.entry not found: "${entry}".`);
  }

  const tsconfigPath = options.config.tsconfig
    ? path.resolve(options.root, options.config.tsconfig)
    : ts.findConfigFile(path.dirname(entry), ts.sys.fileExists, "tsconfig.json");
  if (!tsconfigPath || !fs.existsSync(tsconfigPath)) {
    throw new Error(
      options.config.tsconfig
        ? `introspection.tsconfig not found: "${tsconfigPath}".`
        : `No tsconfig.json found above "${entry}". Set introspection.tsconfig.`,
    );
  }

  const file = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (file.error) throw new Error(`${tsconfigPath}: ${formatDiagnostic(file.error)}`);
  const parsed = ts.parseJsonConfigFileContent(file.config, ts.sys, path.dirname(tsconfigPath));
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
    host: ts.createCompilerHost(compilerOptions),
    oldProgram: options.oldProgram,
  });
  return { program, entry };
}
