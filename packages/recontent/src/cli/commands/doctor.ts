import path from "node:path";
import { DEFAULT_CONFIG, loadConfig, resolveConfigPath } from "@recontentapp/core";
import { createLogger } from "../../core/logger.js";
import { diagnoseRegistry } from "../../core/registry-diagnostics.js";
import { checkDependencies } from "../../resolve/check-dependencies.js";

export type DoctorOptions = {
  config?: string;
};

export async function runDoctor(options: DoctorOptions = {}): Promise<void> {
  const config = await loadConfig(options.config);
  const logger = createLogger(config.logLevel);
  const configDir = path.dirname(resolveConfigPath(options.config ?? DEFAULT_CONFIG));

  for (const diagnostic of config.diagnostics) {
    logger.warn(diagnostic.message);
  }

  const registryDiagnostics = diagnoseRegistry(config.registry);
  for (const diagnostic of registryDiagnostics) {
    console.error(`[recontent:error] ${diagnostic.message}`);
  }

  const dependencyDiagnostics = checkDependencies(configDir, config);
  for (const diagnostic of dependencyDiagnostics) {
    console.error(`[recontent:error] ${diagnostic.message}`);
  }

  const errorCount = registryDiagnostics.length + dependencyDiagnostics.length;
  const issueCount = config.diagnostics.length + errorCount;

  if (issueCount === 0) {
    logger.info("No issues found: config, registry, and dependencies all look good.");
    return;
  }

  logger.info(
    `Found ${config.diagnostics.length} token warning(s), ${registryDiagnostics.length} registry issue(s), and ${dependencyDiagnostics.length} dependency issue(s).`,
  );

  if (errorCount > 0) {
    process.exitCode = 1;
  }
}
