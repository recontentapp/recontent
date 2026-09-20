import path from "node:path";
import { loadConfig, type LogLevel, type PluginContext } from "@recontentapp/core";
import { createLogger } from "../../logger.js";
import { diagnoseRegistry } from "../doctor/registry-diagnostics.js";
import { checkDependencies } from "../doctor/check-dependencies.js";

export type DoctorOptions = {
  cwd: string;
  configPath: string;
  logLevel?: LogLevel;
};

export async function runDoctor(options: DoctorOptions): Promise<void> {
  const config = await loadConfig(options.configPath);
  const logger = createLogger(options.logLevel ?? config.logLevel);
  const configDir = path.dirname(options.configPath);

  for (const diagnostic of config.diagnostics) {
    logger.warn(diagnostic.message);
  }

  const registryDiagnostics = diagnoseRegistry(config.registry);
  for (const diagnostic of registryDiagnostics) {
    logger.error(diagnostic.message);
  }

  const dependencyDiagnostics = checkDependencies(configDir, config);
  for (const diagnostic of dependencyDiagnostics) {
    logger.error(diagnostic.message);
  }

  const ctx: PluginContext = {
    registry: config.registry,
    themes: config.themes,
    root: configDir,
    logger,
    mode: "check",
  };
  let pluginErrorCount = 0;
  for (const plugin of config.plugins) {
    if (!plugin.validate) continue;
    const diagnostics = await plugin.validate(ctx);
    for (const diagnostic of diagnostics) {
      const message = `[${plugin.name}] ${diagnostic.message}`;
      if (diagnostic.severity === "error") {
        logger.error(message);
        pluginErrorCount += 1;
      } else {
        logger.warn(message);
      }
    }
  }

  const errorCount = registryDiagnostics.length + dependencyDiagnostics.length + pluginErrorCount;
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
