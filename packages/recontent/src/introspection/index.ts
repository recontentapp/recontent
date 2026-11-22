import { performance } from "node:perf_hooks";
import path from "node:path";
import type { ComponentInfo, Documentation, IntrospectionConfigInput, TypeInfo } from "./model.js";
import type { Logger } from "../logger.js";
import ts from "typescript";
import {
  findComponents,
  findReactNode,
  type Analysis,
  type IntrospectionWarning,
} from "./components.js";
import type { PendingLinks } from "./jsdoc.js";
import { createIntrospectionProgram, resolveInputs } from "./program.js";
import { createImportResolver } from "./imports.js";
import { describeComponent } from "./props.js";
import { createTypeStore, finishTypes } from "./types.js";

export type IntrospectionResult = {
  /** Sorted by name. */
  components: ComponentInfo[];
  /** The project types the components' props reference, sorted by id. */
  types: TypeInfo[];
  warnings: IntrospectionWarning[];
  /** Pass back as `oldProgram` on the next run to reuse unchanged source files. */
  program: ts.Program;
  /** Absolute paths of everything the result was computed from: every source file of the program, dependencies' declarations included, and the tsconfig files. */
  files: string[];
  /** Absolute paths of referenced doc files that did not exist during this run (for cache invalidation). */
  missingFiles?: string[];
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
  const byTypeName = new Map<string, string[]>();
  for (const type of types) {
    const list = byTypeName.get(type.name) ?? [];
    list.push(type.id);
    byTypeName.set(type.name, list);
  }
  const resolveTarget = (target: string): string | undefined => {
    if (known.has(target)) return target;
    const matches = byTypeName.get(target);
    return matches?.length === 1 ? matches[0] : undefined;
  };
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
    const resolved: string[] = [];
    for (const target of linkTargets) {
      const hit = resolveTarget(target);
      if (hit) resolved.push(hit);
      else logger.debug(`introspection: {@link ${target}} matches no component or type.`);
    }
    const links = [...new Set(resolved)].sort((a, b) => a.localeCompare(b));
    if (links.length > 0) item.links = links;
    const replacement = replacementTargets.map(resolveTarget).find(Boolean);
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
    docFiles: new Set(),
    missingDocFiles: new Set(),
    ancestorsCache: new Map(),
    warnings: [],
  };
  const importOf = createImportResolver(analysis, { entry, root, importPath: config.importPath });
  const components = findComponents(analysis, entry, config.exclude).map((candidate) => {
    const component = describeComponent(analysis, candidate, root);
    const statement = importOf(component.name);
    return statement ? { ...component, import: statement } : component;
  });
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

  const packageJson = ts.findConfigFile(path.dirname(entry), ts.sys.fileExists, "package.json");
  const allFiles = [
    ...new Set([
      ...files,
      ...configFiles.map((file) => path.resolve(file)),
      ...(packageJson ? [path.resolve(packageJson)] : []),
      ...analysis.docFiles,
    ]),
  ];

  return {
    components,
    types,
    warnings: analysis.warnings,
    program,
    files: allFiles,
    ...(analysis.missingDocFiles && analysis.missingDocFiles.size > 0
      ? { missingFiles: [...analysis.missingDocFiles] }
      : {}),
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
