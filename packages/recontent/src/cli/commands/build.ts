import fs from "node:fs";
import path from "node:path";
import type { ComponentInfo, TypeInfo } from "../../introspection/model.js";
import type { EmittedFile } from "../../plugins/types.js";
import type { LogLevel, Logger } from "../../logger.js";
import type ts from "typescript";
import { createLogger } from "../../logger.js";
import { needsIntrospection, runPlugins } from "../../plugins/runner.js";
import { loadIntrospection, loadProject, type Components } from "../project.js";
import { collectLocalImports } from "../config-graph.js";
import { diagnoseRegistry } from "../../token-model/alias.js";
import { exitWithError, reportError, summarizeDiagnostics } from "../utils/exit.js";
import { checkOutputFile, displayPath, writeOutputFile } from "../utils/fs.js";
import { plural } from "../utils/format.js";

export type BuildOptions = {
  cwd: string;
  configPath: string;
  logLevel?: LogLevel;
  watch?: boolean;
  /** Write nothing; fail if any generated file is missing or differs from what the build would write. */
  check?: boolean;
  /** Where the introspection cache is read and written; absent for `--no-cache`. */
  cache?: { version: string };
};

export async function runBuild(options: BuildOptions): Promise<void> {
  if (options.watch) {
    await watchBuild(options);
    return;
  }

  await buildOnce(options, { exitOnError: true });
}

/** What a build leaves behind for the next one in watch mode. */
type BuildState = {
  program?: ts.Program;
  watch?: string[];
  introspection?: Components;
  introspectionKey?: string;
};

async function watchBuild(options: BuildOptions): Promise<void> {
  const logger = createLogger(options.logLevel);

  let state: BuildState = {};

  const safeBuild = async (introspectionDirty = true) => {
    try {
      state = await buildOnce(options, {
        exitOnError: false,
        previous: state,
        introspectionDirty,
      });
    } catch (error) {
      reportError(error, options.logLevel === "debug");
    }
  };

  await safeBuild(true);

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
    // Editing a component changes the docs generated from its props.
    for (const file of state.watch ?? []) files.add(file);

    const sameSet =
      files.size === trackedFiles.size && [...files].every((file) => trackedFiles.has(file));
    if (sameSet && watchers.length > 0) return;

    for (const watcher of watchers) watcher.close();
    watchers = [];
    trackedFiles = files;

    const namesByDir = new Map<string, Set<string>>();
    for (const file of files) {
      const dir = path.dirname(file);
      let names = namesByDir.get(dir);
      if (!names) {
        names = new Set();
        namesByDir.set(dir, names);
      }
      names.add(path.basename(file));
    }

    for (const [dir, dirNames] of namesByDir) {
      try {
        const watcher = fs.watch(dir, (_event, filename) => {
          if (closed) return;
          if (filename && !dirNames.has(filename.toString())) return;
          if (filename) {
            const changedPath = path.join(dir, filename.toString());
            if (state.watch?.includes(changedPath)) {
              introspectionDirty = true;
            }
          } else {
            introspectionDirty = true;
          }
          scheduleBuild();
        });
        watcher.on("error", () => {
          watcher.close();
          const idx = watchers.indexOf(watcher);
          if (idx !== -1) watchers.splice(idx, 1);
        });
        watchers.push(watcher);
      } catch {
        // Directory may have disappeared between collection and watch setup;
        // the next successful build's rewatch() will pick it up again.
      }
    }
  };

  let closed = false;
  let introspectionDirty = false;
  let building = false;
  let rerunQueued = false;

  const triggerBuild = () => {
    if (closed) return;
    if (building) {
      rerunQueued = true;
      return;
    }
    building = true;
    const dirty = introspectionDirty;
    introspectionDirty = false;
    safeBuild(dirty)
      .then(() => {
        if (!closed) rewatch();
      })
      .finally(() => {
        building = false;
        if (!closed && rerunQueued) {
          rerunQueued = false;
          triggerBuild();
        }
      });
  };

  let debounceTimer: NodeJS.Timeout | undefined;
  const scheduleBuild = () => {
    if (closed) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(triggerBuild, 100);
  };

  rewatch();
  logger.info(
    `Watching ${trackedFiles.size} file(s) for changes (starting at ${displayPath(options.cwd, options.configPath)})...`,
  );

  await new Promise<void>((resolve) => {
    const shutdown = () => {
      closed = true;
      clearTimeout(debounceTimer);
      for (const watcher of watchers) watcher.close();
      watchers = [];
      process.off("SIGINT", shutdown);
      process.off("SIGTERM", shutdown);
      resolve();
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  });
}

async function buildOnce(
  options: BuildOptions,
  {
    exitOnError,
    previous = {},
    introspectionDirty = true,
  }: { exitOnError: boolean; previous?: BuildState; introspectionDirty?: boolean },
): Promise<BuildState> {
  const project = await loadProject({ configPath: options.configPath, logLevel: options.logLevel });
  const { config, logger, root } = project;
  let state = previous;
  for (const diagnostic of config.diagnostics) {
    logger.warn(diagnostic.message);
  }
  let warnings = config.diagnostics.length;
  const wantsIntrospection = needsIntrospection(config);

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

  const registryDiagnostics = diagnoseRegistry(config.registry, config.themes);
  if (registryDiagnostics.length > 0) {
    for (const diagnostic of registryDiagnostics) {
      logger.error(diagnostic.message);
    }
    abort(registryDiagnostics.length);
    return state;
  }

  const contextCount = config.themes.reduce(
    (sum, axis) => sum + Object.keys(axis.contexts).length,
    0,
  );
  logger.debug(
    `Loaded build config with ${config.plugins.length} plugin(s), ${config.registry.size} token(s), and ${contextCount} theme context(s) across ${config.themes.length} axis/axes.`,
  );

  const configDir = root;

  if (config.plugins.length === 0) {
    logger.warn(
      `No plugins configured in ${displayPath(options.cwd, options.configPath)}; add some from "recontent/plugins" to generate output.`,
    );
    return state;
  }

  // Only when a plugin consumes them, and a failure only fails those plugins.
  let components: ComponentInfo[] | undefined;
  let types: TypeInfo[] | undefined;
  let introspectionError: string | undefined;
  if (wantsIntrospection) {
    const introspectionKey = JSON.stringify(config.introspection);
    if (!introspectionDirty && state.introspection && state.introspectionKey === introspectionKey) {
      ({ components, types } = state.introspection.introspection);
      for (const warning of state.introspection.warnings) logger.warn(warning.message);
      warnings += state.introspection.warnings.length;
    } else {
      try {
        const loaded = await loadIntrospection(project, {
          oldProgram: state.program,
          cache: options.cache,
        });
        ({ components, types } = loaded.introspection);
        for (const warning of loaded.warnings) logger.warn(warning.message);
        warnings += loaded.warnings.length;
        state = {
          program: loaded.program ?? state.program,
          watch: loaded.watch,
          introspection: loaded,
          introspectionKey,
        };
      } catch (error) {
        introspectionError = error instanceof Error ? error.message : String(error);
      }
    }
  } else {
    state = {};
  }

  const result = await runPlugins(config, {
    root: configDir,
    logger,
    components,
    types,
    introspectionError,
    skipBuildEnd: options.check,
    write: options.check
      ? undefined
      : async (files) => {
          await writeFiles(files, configDir, options.cwd, logger);
        },
  });

  let errors = 0;
  for (const diagnostic of result.diagnostics) {
    const text = `[${diagnostic.plugin}] ${diagnostic.message}${diagnostic.path ? ` (${diagnostic.path.join(".")})` : ""}`;
    if (diagnostic.severity === "error") {
      errors += 1;
      logger.error(text);
    } else {
      warnings += 1;
      logger.warn(text);
    }
  }

  const failed = result.failures.length;
  for (const failure of result.failures) logger.error(failure);

  if (errors > 0) {
    abort(errors + failed);
    return state;
  }

  if (options.check) {
    const outOfDate = await checkFiles(result.files, configDir, options.cwd, logger);
    if (outOfDate > 0) {
      const message = `check failed: ${outOfDate} of ${result.files.length} files out of date; run \`recontent build\``;
      // With failed plugins, `abort` below is the one closing error line.
      if (failed > 0) logger.warn(message);
      else if (exitOnError) exitWithError(message);
      else logger.error(message);
    } else {
      logger.info(`${plural(result.files.length, "file")} up to date`);
    }
  }
  if (failed > 0) abort(failed);
  return state;
}

async function writeFiles(
  files: readonly EmittedFile[],
  root: string,
  cwd: string,
  logger: Logger,
) {
  const results = await Promise.all(
    files.map((file) =>
      writeOutputFile(file.path, file.content, root, { writeMode: file.writeMode }).then((res) => ({
        file,
        res,
      })),
    ),
  );
  let written = 0;
  let skipped = 0;
  for (const { file, res } of results) {
    const { path: outputPath, written: wasWritten, skipReason } = res;
    const shownPath = displayPath(cwd, outputPath);
    if (wasWritten) {
      written += 1;
      logger.info(`Wrote ${shownPath}`);
      logger.debug(
        `Wrote ${Buffer.byteLength(file.content, "utf8").toLocaleString()} bytes to ${shownPath}.`,
      );
    } else {
      skipped += 1;
      logger.info(
        `Skipped ${shownPath} (${skipReason === "exists" ? "already exists" : "unchanged"})`,
      );
    }
  }
  logger.info(`Wrote ${plural(written, "file")}${skipped > 0 ? ` (${skipped} skipped)` : ""}`);
}

/** Logs each stale or missing file and returns how many there were. */
async function checkFiles(
  files: readonly EmittedFile[],
  root: string,
  cwd: string,
  logger: Logger,
) {
  const results = await Promise.all(
    files.map((file) =>
      checkOutputFile(file.path, file.content, root, { writeMode: file.writeMode }),
    ),
  );
  let outOfDate = 0;
  for (const { path: outputPath, status } of results) {
    const shownPath = displayPath(cwd, outputPath);
    if (status === "fresh") {
      logger.debug(`Up to date ${shownPath}`);
      continue;
    }
    outOfDate += 1;
    logger.error(`${status === "stale" ? "Stale" : "Missing"} ${shownPath}`);
  }
  return outOfDate;
}
