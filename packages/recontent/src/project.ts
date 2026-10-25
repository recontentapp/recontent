import path from "node:path";
import {
  loadConfig,
  type ComponentManifest,
  type Config,
  type GitInfo,
  type Logger,
  type LogLevel,
} from "@recontentapp/core";
import type ts from "typescript";
import { readFileHistory, readGitInfo } from "./git.js";
import { introspect } from "./introspection/index.js";
import { createLogger } from "./logger.js";

export type Project = {
  config: Config;
  logger: Logger;
  /** Directory containing the config file. */
  root: string;
  /** Present when `components` was requested and the config sets `introspection`. */
  components?: ComponentManifest;
  git?: GitInfo;
  /** Present with `components`: reuse as `oldProgram` and watch `files`. */
  program?: ts.Program;
  files?: string[];
};

/**
 * What plugins and `inspect` see: the config's tokens, plus components when
 * introspection is configured and asked for (it builds a TS program, so
 * token-only commands leave it off), plus git metadata when available.
 */
export async function loadProject(options: {
  configPath: string;
  logLevel?: LogLevel;
  components: boolean;
  oldProgram?: ts.Program;
}): Promise<Project> {
  const config = await loadConfig(options.configPath);
  const logger = createLogger(options.logLevel ?? config.logLevel);
  const root = path.dirname(options.configPath);

  const git = readGitInfo(root);
  if (!git) logger.debug("git: not available, skipping git metadata.");

  const project: Project = { config, logger, root, ...(git ? { git } : {}) };
  if (!options.components || !config.introspection) return project;

  const { manifest, program, files } = introspect({
    config: config.introspection,
    root,
    logger,
    oldProgram: options.oldProgram,
  });
  for (const warning of manifest.warnings) logger.warn(warning.message);

  if (git) {
    const history = readFileHistory(
      root,
      manifest.components.map((component) => path.resolve(root, component.sourceFilePath)),
    );
    for (const component of manifest.components) {
      const fileHistory = history.get(path.resolve(root, component.sourceFilePath));
      if (fileHistory) component.history = fileHistory;
    }
  }

  return { ...project, components: manifest, program, files };
}
