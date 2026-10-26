import path from "node:path";
import {
  loadConfig,
  type ComponentInfo,
  type Config,
  type Logger,
  type LogLevel,
} from "@recontentapp/core";
import ts from "typescript";
import { readHead, readLastUpdated } from "./git.js";
import { introspect, watchableFiles } from "./introspection/index.js";
import { readCache, writeCache } from "./introspection/cache.js";
import { resolveInputs } from "./introspection/program.js";
import { createLogger } from "./logger.js";

export type Project = {
  config: Config;
  logger: Logger;
  configPath: string;
  /** Directory containing the config file. */
  root: string;
};

export async function loadProject(options: {
  configPath: string;
  logLevel?: LogLevel;
}): Promise<Project> {
  const config = await loadConfig(options.configPath);
  const logger = createLogger(options.logLevel ?? config.logLevel);
  return { config, logger, configPath: options.configPath, root: path.dirname(options.configPath) };
}

export type Components = {
  /** Sorted by name. */
  components: ComponentInfo[];
  /** Already logged; kept to count them. */
  warnings: string[];
  /** Files whose change should trigger a rebuild. */
  watch: string[];
  /** Pass back as `oldProgram`. Absent when the cache answered. */
  program?: ts.Program;
};

/**
 * Introspects the components of a project whose config sets `introspection`:
 * from the cache when nothing it was computed from has changed, else by
 * building a TypeScript program (and writing the cache). Throws when the
 * introspection setup is broken.
 */
export async function loadComponents(
  project: Project,
  options: {
    oldProgram?: ts.Program;
    /** Absent for `--no-cache`: neither read nor written. `version` is recontent's, since a new one may analyze differently. */
    cache?: { version: string };
  },
): Promise<Components> {
  const { config, logger, configPath, root } = project;
  const introspection = config.introspection!;
  const { entry, tsconfigPath } = resolveInputs(introspection, root);

  const key =
    options.cache &&
    JSON.stringify({
      recontent: options.cache.version,
      typescript: ts.version,
      config: introspection,
      entry,
      tsconfigPath,
      // The last-updated dates move with every commit.
      head: introspection.history ? readHead(root) : undefined,
    });

  const cached = key === undefined ? undefined : readCache(root, configPath, key);
  if (cached) {
    logger.debug("introspection: reused the cache.");
    for (const warning of cached.warnings) logger.warn(warning);
    return {
      components: cached.components,
      warnings: cached.warnings,
      watch: watchableFiles(entry, cached.files),
    };
  }

  const result = introspect({
    config: introspection,
    root,
    logger,
    oldProgram: options.oldProgram,
  });
  const warnings = [...result.warnings];
  if (introspection.history) {
    const { dates, warning } = await readLastUpdated(
      root,
      result.components.map((component) => path.resolve(root, component.sourceFilePath)),
    );
    for (const component of result.components) {
      const date = dates.get(path.resolve(root, component.sourceFilePath));
      if (date) component.lastUpdatedAt = date;
    }
    if (warning) warnings.push(warning);
  }

  const watch = watchableFiles(entry, result.files);
  if (key !== undefined) {
    writeCache(root, configPath, key, {
      components: result.components,
      warnings,
      files: result.files,
      // Not the config's own: `.recontent` and the plugins' output are created there after this is stamped.
      directories: [...new Set(watch.map((file) => path.dirname(file)))].filter(
        (directory) => directory !== root,
      ),
    });
  }
  for (const warning of warnings) logger.warn(warning);
  return {
    components: result.components,
    warnings,
    watch,
    program: result.program,
  };
}
