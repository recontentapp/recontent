import fs, { promises as fsp } from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadConfig } from "../../../config/load.js";
import { type LogLevel } from "../../../logger.js";
import { diffComponents, type ComponentsDiff } from "./components.js";
import { diffConfigs } from "./tokens.js";
import { countBreakingChanges, formatDiff, formatDiffError, type DiffFormat } from "./format.js";
import { loadIntrospection, loadProject } from "../../project.js";
import type { Introspected } from "../../../snapshot/snapshot.js";
import { diagnoseRegistry } from "../../../token-model/alias.js";
import { exitWithError, reportError } from "../../utils/exit.js";
import { plural } from "../../utils/format.js";
import {
  archiveRevision,
  assertAncestorOfHead,
  assertHasCommits,
  assertRevision,
  linkNodeModules,
  resolveGitRoot,
} from "../../git.js";

export type DiffOptions = {
  cwd: string;
  configPath: string;
  logLevel?: LogLevel;
  rev?: string;
  failOnBreaking?: boolean;
  format?: DiffFormat;
  /** Absent for `--no-cache`. Only the working tree's introspection is cached. */
  cache?: { version: string };
};

/** With `--format json`, a failure is also an error document on stdout, where a script reads it. */
export async function runDiff(options: DiffOptions): Promise<void> {
  try {
    await diffAgainstRevision(options);
  } catch (error) {
    if (options.format !== "json") throw error;
    reportError(error, options.logLevel === "debug");
    console.log(formatDiffError(error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  }
}

async function diffAgainstRevision(options: DiffOptions): Promise<void> {
  const rev = options.rev ?? "HEAD";
  const configPath = options.configPath;
  const configDir = path.dirname(configPath);
  const gitRoot = resolveGitRoot(configDir);

  const canonicalGitRoot = fs.realpathSync(gitRoot);
  const canonicalConfigPath = fs.realpathSync(configPath);
  const relPath = path.relative(canonicalGitRoot, canonicalConfigPath);
  if (relPath.startsWith("..") || path.isAbsolute(relPath)) {
    throw new Error(`Config file "${configPath}" is outside the git repository at "${gitRoot}".`);
  }

  assertHasCommits(gitRoot);
  assertRevision(gitRoot, rev);
  assertAncestorOfHead(gitRoot, rev);

  const headProject = await loadProject({ configPath, logLevel: options.logLevel });
  const { config: headConfig, logger } = headProject;
  for (const diagnostic of headConfig.diagnostics) logger.warn(diagnostic.message);
  const brokenTokens = diagnoseRegistry(headConfig.registry, headConfig.themes);
  if (brokenTokens.length > 0) {
    for (const diagnostic of brokenTokens) logger.error(diagnostic.message);
    throw new Error(`${brokenTokens.length} token error(s) in ${relPath}`);
  }

  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "recontent-diff-"));
  const cleanupSync = () => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup on signal.
    }
  };
  const onSignal = (signal: NodeJS.Signals) => {
    cleanupSync();
    process.exit(signal === "SIGINT" ? 130 : 143);
  };
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);

  let baseConfig;
  let components: ComponentsDiff | undefined;
  let componentsNote: string | undefined;
  try {
    // Reproduce the whole tree at `rev` (not just the config file) so a
    // config that imports a sibling file, or a shared preset, can still be
    // loaded — `git archive` works on the shallow clones `actions/checkout`
    // produces by default, as long as the rev itself is present, and leaves
    // no lock files or worktree to clean up.
    archiveRevision(gitRoot, rev, tmpDir);
    const tmpConfigPath = path.join(tmpDir, relPath);
    if (!fs.existsSync(tmpConfigPath)) {
      throw new Error(`Config file "${relPath}" did not exist at revision "${rev}".`);
    }
    // The archive holds no installed dependencies, which introspection needs to resolve types.
    linkNodeModules(canonicalGitRoot, tmpDir, path.dirname(canonicalConfigPath));
    baseConfig = await loadConfig(tmpConfigPath, { resolveFrom: configDir });

    if (headConfig.introspection && !baseConfig.introspection) {
      componentsNote = `Components were not compared: ${rev} has no introspection configured.`;
    } else if (baseConfig.introspection) {
      // A diff that silently dropped components would mislead, so a failure here fails the command.
      const base = await loadIntrospection(
        {
          // The old revision's warnings are not actionable.
          config: baseConfig,
          logger,
          configPath: tmpConfigPath,
          root: path.dirname(tmpConfigPath),
        },
        {},
      ).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Introspecting the components at ${rev} failed: ${message}`);
      });
      // Dropping `introspection` removes every component and type, which is breaking.
      let head: Introspected = { components: [], types: [] };
      if (headConfig.introspection) {
        const loaded = await loadIntrospection(headProject, { cache: options.cache });
        for (const warning of loaded.warnings) logger.warn(warning.message);
        head = loaded.introspection;
      }
      components = diffComponents(base.introspection, head);
    }
  } finally {
    process.off("SIGINT", onSignal);
    process.off("SIGTERM", onSignal);
    await fsp.rm(tmpDir, { recursive: true, force: true });
  }

  const diff = { tokens: diffConfigs(baseConfig, headConfig), components, componentsNote };

  // The diff is the command's payload (stdout, so `--format json` can be
  // piped). The markdown header stays on stderr; JSON carries the same
  // information as fields, so nothing but the object is ever printed.
  const format = options.format ?? "markdown";
  if (format === "markdown") {
    logger.info(`Comparing ${relPath} against ${rev}`);
  }
  console.log(formatDiff(diff, format, { config: relPath, rev }));

  const breaking = countBreakingChanges(diff);
  if (options.failOnBreaking && breaking > 0) {
    exitWithError(`${plural(breaking, "breaking change")} found`);
  }
}
