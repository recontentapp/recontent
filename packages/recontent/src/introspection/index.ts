import { performance } from "node:perf_hooks";
import path from "node:path";
import {
  INTROSPECTION_SCHEMA_VERSION,
  type ComponentManifest,
  type IntrospectionConfigInput,
  type Logger,
} from "@recontentapp/core";
import type ts from "typescript";
import { findComponents, findReactNode, type Analysis } from "./components.js";
import { createIntrospectionProgram } from "./program.js";
import { describeComponent } from "./props.js";

export type IntrospectionResult = {
  manifest: ComponentManifest;
  /** Pass back as `oldProgram` on the next run to reuse unchanged source files. */
  program: ts.Program;
  /** Absolute paths of the project's own source files the manifest was built from. */
  files: string[];
};

export function introspect(options: {
  config: IntrospectionConfigInput;
  root: string;
  logger: Logger;
  oldProgram?: ts.Program;
}): IntrospectionResult {
  const { config, root, logger } = options;

  const programStart = performance.now();
  const { program, entry } = createIntrospectionProgram(options);
  const checker = program.getTypeChecker();
  const programMs = performance.now() - programStart;

  const reactNode = findReactNode(program, checker);
  if (!reactNode) {
    throw new Error(
      `Could not find React's types from "${entry}". Install @types/react and import it in the entry's module graph.`,
    );
  }

  const analyzeStart = performance.now();
  const analysis: Analysis = { program, checker, reactNode, logger };
  const warnings: ComponentManifest["warnings"] = [];
  const components = findComponents(analysis, entry, config.exclude).map((candidate) => {
    const { info, warning } = describeComponent(analysis, candidate, root);
    if (warning) warnings.push({ message: warning, component: candidate.name });
    return info;
  });
  components.sort((a, b) => a.name.localeCompare(b.name));
  logger.debug(
    `introspection: ${components.length} component(s), program ${Math.round(programMs)}ms, analysis ${Math.round(performance.now() - analyzeStart)}ms.`,
  );

  const files = program
    .getSourceFiles()
    .filter(
      (file) =>
        !program.isSourceFileFromExternalLibrary(file) && !program.isSourceFileDefaultLibrary(file),
    )
    .map((file) => path.resolve(file.fileName))
    .filter((file) => !file.split(path.sep).includes("node_modules"));

  return {
    manifest: { schemaVersion: INTROSPECTION_SCHEMA_VERSION, components, warnings },
    program,
    files,
  };
}
