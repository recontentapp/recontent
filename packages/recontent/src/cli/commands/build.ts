import fs from "node:fs";
import path from "node:path";
import { createLogger } from "../../logger.js";
import { MissingDesignTokensError } from "../../plugins/errors.js";
import { runPlugins } from "../../plugins/runner.js";
import { ensureDependencies } from "../install-dependencies.js";
import { loadConfig, type LogLevel } from "@recontentapp/core";
import { collectLocalImports } from "../config-graph.js";
import { exitWithError, logSuccess } from "../utils/exit.js";
import { writeOutputFile } from "../utils/fs.js";

export type BuildOptions = {
  cwd: string;
  configPath: string;
  logLevel?: LogLevel;
  watch?: boolean;
};

export async function runBuild(options: BuildOptions): Promise<void> {
  if (options.watch) {
    await watchBuild(options);
    return;
  }

  await buildOnce(options, { exitOnError: true });
}

async function watchBuild(options: BuildOptions): Promise<void> {
  const logger = createLogger(options.logLevel);

  const safeBuild = async () => {
    try {
      await buildOnce(options, { exitOnError: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(message);
    }
  };

  await safeBuild();

  // Directory watches (rather than a watch on the file itself) survive an
  // editor's atomic save (write temp file, rename over the original), which
  // replaces the inode a file-level `fs.watch` is attached to and leaves it
  // silently dead for the rest of the process. We watch every directory that
  // holds a file the config depends on (its own directory, plus one per
  // local import), and recompute that set after each successful build so a
  // newly added or removed import is picked up too.
  let watchers: fs.FSWatcher[] = [];
  let trackedFiles = new Set<string>();

  const rewatch = () => {
    let files: Set<string>;
    try {
      files = collectLocalImports(options.configPath);
    } catch {
      files = new Set([options.configPath]);
    }
    files.add(options.configPath);

    const sameSet =
      files.size === trackedFiles.size && [...files].every((file) => trackedFiles.has(file));
    if (sameSet && watchers.length > 0) return;

    for (const watcher of watchers) watcher.close();
    watchers = [];
    trackedFiles = files;

    const trackedNames = new Set([...files].map((file) => path.basename(file)));
    const directories = new Set([...files].map((file) => path.dirname(file)));

    for (const dir of directories) {
      try {
        const watcher = fs.watch(dir, (_event, filename) => {
          if (filename && !trackedNames.has(filename.toString())) return;
          scheduleBuild();
        });
        watchers.push(watcher);
      } catch {
        // Directory may have disappeared between collection and watch setup;
        // the next successful build's rewatch() will pick it up again.
      }
    }
  };

  let building = false;
  let rerunQueued = false;

  const triggerBuild = () => {
    if (building) {
      rerunQueued = true;
      return;
    }
    building = true;
    safeBuild()
      .then(() => rewatch())
      .finally(() => {
        building = false;
        if (rerunQueued) {
          rerunQueued = false;
          triggerBuild();
        }
      });
  };

  let debounceTimer: NodeJS.Timeout | undefined;
  const scheduleBuild = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(triggerBuild, 100);
  };

  rewatch();
  logger.info(
    `Watching ${trackedFiles.size} file(s) for changes (starting at ${options.configPath})...`,
  );

  await new Promise<void>((resolve) => {
    const shutdown = () => {
      clearTimeout(debounceTimer);
      for (const watcher of watchers) watcher.close();
      resolve();
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  });
}

async function buildOnce(
  options: BuildOptions,
  { exitOnError }: { exitOnError: boolean },
): Promise<void> {
  const config = await loadConfig(options.configPath);
  const effectiveLogLevel = options.logLevel ?? config.logLevel;
  const logger = createLogger(effectiveLogLevel);
  for (const diagnostic of config.diagnostics) {
    logger.warn(diagnostic.message);
  }
  logger.debug(
    `Loaded build config with ${config.plugins.length} plugin(s), ${config.registry.size} token(s), and ${Object.keys(config.themes).length} theme(s).`,
  );

  const configDir = path.dirname(options.configPath);
  ensureDependencies(configDir, config.resolve, effectiveLogLevel);

  if (config.plugins.length === 0) {
    logger.info("No plugins configured in recontent.config.ts");
    return;
  }

  const mode = options.watch ? "watch" : "build";
  let result;
  try {
    result = await runPlugins(config, { root: configDir, mode, logger });
  } catch (error) {
    if (error instanceof MissingDesignTokensError) {
      if (exitOnError) {
        exitWithError(error.message);
        return;
      }
      logger.error(error.message);
      return;
    }
    throw error;
  }

  for (const diagnostic of result.diagnostics) {
    if (diagnostic.severity === "error") {
      logger.error(diagnostic.message);
    } else {
      logger.warn(diagnostic.message);
    }
  }

  if (result.diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    const message = "Build aborted: one or more plugins reported an error.";
    if (exitOnError) {
      exitWithError(message);
      return;
    }
    logger.error(message);
    return;
  }

  for (const file of result.files) {
    const { path: outputPath, written } = await writeOutputFile(
      file.path,
      file.content,
      configDir,
      { writeMode: file.writeMode },
    );
    if (written) {
      logSuccess(`Wrote ${outputPath}`);
      logger.debug(`Wrote ${file.content.length.toLocaleString()} bytes to ${outputPath}.`);
    } else {
      logSuccess(`Skipped ${outputPath} (already exists)`);
    }
  }
}
