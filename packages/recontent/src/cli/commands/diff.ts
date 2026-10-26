import { promises as fsp } from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadConfig, type LogLevel } from "@recontentapp/core";
import { countBreakingChanges, diffConfigs, formatDiff, type DiffFormat } from "../diff/diff.js";
import { createLogger } from "../../logger.js";
import { exitWithError } from "../utils/exit.js";
import { plural } from "../utils/format.js";
import {
  archiveRevision,
  assertAncestorOfHead,
  assertHasCommits,
  assertRevision,
  resolveGitRoot,
} from "../../git.js";

export type DiffOptions = {
  cwd: string;
  configPath: string;
  logLevel?: LogLevel;
  rev?: string;
  failOnBreaking?: boolean;
  format?: DiffFormat;
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

  assertHasCommits(gitRoot);
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
