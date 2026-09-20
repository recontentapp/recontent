import { promises as fsp } from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadConfig, type LogLevel } from "@recontentapp/core";
import { diffConfigs, formatDiff, hasBreakingChanges } from "../diff/diff.js";
import { createLogger } from "../../logger.js";
import {
  archiveRevision,
  assertAncestorOfHead,
  assertRevision,
  resolveGitRoot,
} from "../utils/git.js";

export type DiffOptions = {
  cwd: string;
  configPath: string;
  logLevel?: LogLevel;
  rev?: string;
  failOnBreaking?: boolean;
};

export async function runDiff(options: DiffOptions): Promise<void> {
  const rev = options.rev ?? "HEAD";
  const configPath = options.configPath;
  const configDir = path.dirname(configPath);
  const gitRoot = resolveGitRoot(configDir);

  const relPath = path.relative(gitRoot, configPath);
  if (relPath.startsWith("..") || path.isAbsolute(relPath)) {
    throw new Error(`Config file "${configPath}" is outside the git repository at "${gitRoot}".`);
  }

  assertRevision(gitRoot, rev);
  assertAncestorOfHead(gitRoot, rev);

  const headConfig = await loadConfig(configPath);
  const logger = createLogger(options.logLevel ?? headConfig.logLevel);

  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "recontent-diff-"));
  let baseConfig;
  try {
    // Reproduce the whole tree at `rev` (not just the config file) so a
    // config that imports a sibling file, or a shared preset, can still be
    // loaded — `git archive` works on the shallow clones `actions/checkout`
    // produces by default, as long as the rev itself is present, and leaves
    // no lock files or worktree to clean up.
    archiveRevision(gitRoot, rev, tmpDir);
    const tmpConfigPath = path.join(tmpDir, relPath);
    baseConfig = await loadConfig(tmpConfigPath, { resolveFrom: configDir });
  } finally {
    await fsp.rm(tmpDir, { recursive: true, force: true });
  }

  const diff = diffConfigs(baseConfig, headConfig);

  logger.info(`Comparing ${relPath} against ${rev}`);
  logger.info("");
  logger.info(formatDiff(diff));

  if (options.failOnBreaking && hasBreakingChanges(diff)) {
    process.exitCode = 1;
  }
}
