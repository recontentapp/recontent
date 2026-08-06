import { promises as fsp } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DEFAULT_CONFIG, loadConfig, resolveConfigPath } from "@recontentapp/core";
import { findExternalImports } from "../diff/config-imports.js";
import { diffConfigs, formatDiff, hasBreakingChanges } from "../diff/diff.js";
import { createLogger } from "../../logger.js";
import { assertRevision, readFileAtRevision, resolveGitRoot } from "../utils/git.js";

export type DiffOptions = {
  config?: string;
  rev?: string;
  failOnBreaking?: boolean;
};

function assertSelfContained(source: string, relPath: string, label: string): void {
  const externalImports = findExternalImports(source, relPath);
  if (externalImports.length > 0) {
    throw new Error(
      `recontent diff requires a self-contained config. "${relPath}" ${label} imports from: ${externalImports.join(", ")}.\n` +
        `Move those token definitions into recontent.config.ts, or diff the generated output instead.`,
    );
  }
}

export async function runDiff(options: DiffOptions = {}): Promise<void> {
  const rev = options.rev ?? "HEAD";
  const configPath = resolveConfigPath(options.config ?? DEFAULT_CONFIG);
  const configDir = path.dirname(configPath);
  const gitRoot = resolveGitRoot(configDir);

  const relPath = path.relative(gitRoot, configPath);
  if (relPath.startsWith("..") || path.isAbsolute(relPath)) {
    throw new Error(`Config file "${configPath}" is outside the git repository at "${gitRoot}".`);
  }

  const workingSource = await fsp.readFile(configPath, "utf-8");
  assertSelfContained(workingSource, relPath, "in the working tree");

  assertRevision(gitRoot, rev);
  const baseSource = readFileAtRevision(gitRoot, rev, relPath);
  assertSelfContained(baseSource, relPath, `at "${rev}"`);

  const headConfig = await loadConfig(configPath);

  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "recontent-diff-"));
  let baseConfig;
  try {
    const tmpConfigPath = path.join(tmpDir, "recontent.config.ts");
    await fsp.writeFile(tmpConfigPath, baseSource, "utf-8");
    baseConfig = await loadConfig(tmpConfigPath, { resolveFrom: configDir });
  } finally {
    await fsp.rm(tmpDir, { recursive: true, force: true });
  }

  const diff = diffConfigs(baseConfig, headConfig);
  const logger = createLogger(headConfig.logLevel);

  logger.info(`Comparing ${relPath} against ${rev}`);
  logger.info("");
  logger.info(formatDiff(diff));

  if (options.failOnBreaking && hasBreakingChanges(diff)) {
    process.exitCode = 1;
  }
}
