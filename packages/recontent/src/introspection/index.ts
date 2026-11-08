import { performance } from "node:perf_hooks";
import path from "node:path";
import type {
  ComponentInfo,
  Documentation,
  IntrospectionConfigInput,
  Logger,
  TypeInfo,
} from "@recontentapp/core";
import ts from "typescript";
import { findComponents, findReactNode, type Analysis } from "./components.js";
import type { PendingLinks } from "./jsdoc.js";
import { createIntrospectionProgram, resolveInputs } from "./program.js";
import { describeComponent } from "./props.js";
import { createTypeStore, finishTypes } from "./types.js";

export type IntrospectionResult = {
  /** Sorted by name. */
  components: ComponentInfo[];
  /** The project types the components' props reference, sorted by id. */
  types: TypeInfo[];
  warnings: string[];
  /** Pass back as `oldProgram` on the next run to reuse unchanged source files. */
  program: ts.Program;
  /** Absolute paths of everything the result was computed from: every source file of the program, dependencies' declarations included, and the tsconfig files. */
  files: string[];
};

/**
 * Turns the link names collected while describing into `links` and
 * `replacement`: the ones that name a component or a type. The others stay
 * plain text in the documentation.
 */
function resolveLinks(components: ComponentInfo[], types: TypeInfo[], logger: Logger): void {
  const known = new Set([
    ...components.map((component) => component.name),
    ...types.map((type) => type.id),
  ]);
  const items: (Documentation & PendingLinks)[] = [
    ...components,
    ...components.flatMap((component) => component.props),
    ...types,
    ...types.flatMap((type) => type.members ?? []),
  ];
  for (const item of items) {
    const { linkTargets = [], replacementTargets = [] } = item;
    delete item.linkTargets;
    delete item.replacementTargets;
    for (const target of linkTargets) {
      if (!known.has(target))
        logger.debug(`introspection: {@link ${target}} matches no component or type.`);
    }
    const links = [...new Set(linkTargets.filter((target) => known.has(target)))].sort((a, b) =>
      a.localeCompare(b),
    );
    if (links.length > 0) item.links = links;
    const replacement = replacementTargets.find((target) => known.has(target));
    if (replacement) item.replacement = replacement;
  }
}

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
  const analysis: Analysis = {
    program,
    checker,
    reactNode,
    logger,
    types: createTypeStore(root),
    warnings: [],
  };
  const components = findComponents(analysis, entry, config.exclude).map((candidate) =>
    describeComponent(analysis, candidate, root),
  );
  components.sort((a, b) => a.name.localeCompare(b.name));
  const types = finishTypes(analysis, components);
  resolveLinks(components, types, logger);
  logger.debug(
    `introspection: ${components.length} component(s), ${types.length} type(s), program ${Math.round(programMs)}ms, analysis ${Math.round(performance.now() - analyzeStart)}ms.`,
  );

  const files = program
    .getSourceFiles()
    .filter((file) => !program.isSourceFileDefaultLibrary(file))
    .map((file) => path.resolve(file.fileName));

  return {
    components,
    types,
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
