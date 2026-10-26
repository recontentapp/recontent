import { performance } from "node:perf_hooks";
import path from "node:path";
import type { ComponentInfo, IntrospectionConfigInput, Logger } from "@recontentapp/core";
import ts from "typescript";
import { findComponents, findReactNode, type Analysis } from "./components.js";
import { createIntrospectionProgram, resolveInputs } from "./program.js";
import { describeComponent } from "./props.js";

export type IntrospectionResult = {
  /** Sorted by name. */
  components: ComponentInfo[];
  warnings: string[];
  /** Pass back as `oldProgram` on the next run to reuse unchanged source files. */
  program: ts.Program;
  /** Absolute paths of everything the result was computed from: every source file of the program, dependencies' declarations included, and the tsconfig files. */
  files: string[];
};

export function introspect(options: {
  config: IntrospectionConfigInput;
  root: string;
  logger: Logger;
  oldProgram?: ts.Program;
}): IntrospectionResult {
  const { config, root, logger } = options;
  const { entry, tsconfigPath } = resolveInputs(config, root);

  const programStart = performance.now();
  const { program, configFiles } = createIntrospectionProgram({
    entry,
    tsconfigPath,
    oldProgram: options.oldProgram,
  });
  const checker = program.getTypeChecker();
  const programMs = performance.now() - programStart;

  const reactNode = findReactNode(program, checker, entry);
  if (!reactNode) {
    throw new Error(
      `Could not find React's types from "${entry}". Install @types/react and import it in the entry's module graph.`,
    );
  }

  const analyzeStart = performance.now();
  const analysis: Analysis = { program, checker, reactNode, logger, warnings: [] };
  const components = findComponents(analysis, entry, config.exclude).map((candidate) =>
    describeComponent(analysis, candidate, root),
  );
  components.sort((a, b) => a.name.localeCompare(b.name));
  logger.debug(
    `introspection: ${components.length} component(s), program ${Math.round(programMs)}ms, analysis ${Math.round(performance.now() - analyzeStart)}ms.`,
  );

  const files = program
    .getSourceFiles()
    .filter((file) => !program.isSourceFileDefaultLibrary(file))
    .map((file) => path.resolve(file.fileName));

  return {
    components,
    warnings: analysis.warnings,
    program,
    files: [...files, ...configFiles.map((file) => path.resolve(file))],
  };
}

/**
 * The files a watcher should follow: the project's own, within the entry's
 * package. Following everything the barrel reaches would register a watcher
 * per directory of a large app, and dependencies don't change while you work.
 */
export function watchableFiles(entry: string, files: string[]): string[] {
  const packageJson = ts.findConfigFile(path.dirname(entry), ts.sys.fileExists, "package.json");
  const packageRoot = path.dirname(packageJson ?? entry);
  return files.filter((file) => {
    const relative = path.relative(packageRoot, file);
    return (
      !relative.startsWith("..") &&
      !path.isAbsolute(relative) &&
      !relative.split(path.sep).includes("node_modules")
    );
  });
}
