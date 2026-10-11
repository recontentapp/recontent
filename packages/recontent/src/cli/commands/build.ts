import fs from "node:fs";
import path from "node:path";
import { createLogger } from "../../logger.js";
import { MissingDesignTokensError } from "../../plugins/errors.js";
import { runPlugins } from "../../plugins/runner.js";
import { ensureDependencies } from "../install-dependencies.js";
import { loadConfig, type LogLevel } from "@recontentapp/core";
import { collectLocalImports } from "../config-graph.js";
import { diagnoseRegistry } from "../registry-diagnostics.js";
import { exitWithError, reportError, summarizeDiagnostics } from "../utils/exit.js";
import { displayPath, writeOutputFile } from "../utils/fs.js";
import { plural } from "../utils/format.js";

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
      reportError(error, options.logLevel === "debug");
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
  let warnings = config.diagnostics.length;

  // Each diagnostic is logged where it is found; aborting only adds the
  // closing "N errors, M warnings" line, so no error is reported twice.
  const abort = (errors: number) => {
    const message = `build failed: ${summarizeDiagnostics(errors, warnings)}`;
    if (exitOnError) {
      exitWithError(message);
    } else {
      logger.error(message);
    }
  };

  const registryDiagnostics = diagnoseRegistry(config.registry);
  if (registryDiagnostics.length > 0) {
    for (const diagnostic of registryDiagnostics) {
      logger.error(diagnostic.message);
    }
    abort(registryDiagnostics.length);
    return;
  }

  logger.debug(
    `Loaded build config with ${config.plugins.length} plugin(s), ${config.registry.size} token(s), and ${Object.keys(config.themes).length} theme(s).`,
  );

  const configDir = path.dirname(options.configPath);
  ensureDependencies(configDir, config.resolve, effectiveLogLevel);

  if (config.plugins.length === 0) {
    logger.warn(
      `No plugins configured in ${displayPath(options.cwd, options.configPath)}; add some from "recontent/plugins" to generate output.`,
    );
    return;
  }

  const mode = options.watch ? "watch" : "build";
  let result;
  try {
    result = await runPlugins(config, { root: configDir, mode, logger });
  } catch (error) {
    if (error instanceof MissingDesignTokensError) {
      for (const message of error.errors) {
        logger.error(message);
      }
      abort(error.errors.length);
      return;
    }
    throw error;
  }

  let errors = 0;
  for (const diagnostic of result.diagnostics) {
    if (diagnostic.severity === "error") {
      errors += 1;
      logger.error(diagnostic.message);
    } else {
      warnings += 1;
      logger.warn(diagnostic.message);
    }
  }

  if (errors > 0) {
    abort(errors);
    return;
  }

  let written = 0;
  let skipped = 0;
  for (const file of result.files) {
    const { path: outputPath, written: wasWritten } = await writeOutputFile(
      file.path,
      file.content,
      configDir,
      { writeMode: file.writeMode },
    );
    const shownPath = displayPath(options.cwd, outputPath);
    if (wasWritten) {
      written += 1;
      logger.info(`Wrote ${shownPath}`);
      logger.debug(`Wrote ${file.content.length.toLocaleString()} bytes to ${shownPath}.`);
    } else {
      skipped += 1;
      logger.info(`Skipped ${shownPath} (already exists)`);
    }
  }
  logger.info(`Wrote ${plural(written, "file")}${skipped > 0 ? ` (${skipped} skipped)` : ""}`);
}
