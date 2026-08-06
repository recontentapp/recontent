import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { type LogLevel, type ResolveConfigInput } from "@recontentapp/core";
import { createLogger } from "../logger.js";

function hasReachableNodeModules(configDir: string): boolean {
  let current = path.resolve(configDir);

  while (true) {
    if (fs.existsSync(path.join(current, "node_modules"))) {
      return true;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return false;
    }
    current = parent;
  }
}

export function ensureDependencies(
  configDir: string,
  resolve: ResolveConfigInput | undefined,
  logLevel: LogLevel = "info",
): void {
  const logger = createLogger(logLevel);
  const dependenciesInstalled = hasReachableNodeModules(configDir);

  logger.debug(
    `Dependency resolution: configDir=${configDir}, resolveConfigured=${Boolean(resolve)}, reachableNodeModules=${dependenciesInstalled}.`,
  );

  if (!resolve || dependenciesInstalled) {
    return;
  }

  logger.info(`Dependencies are not installed. Installing with ${resolve.packageManager}...`);
  logger.debug(`Running resolve.installCommand in ${configDir}: ${resolve.installCommand}`);

  const result = spawnSync(resolve.installCommand, {
    cwd: configDir,
    shell: true,
    stdio: "inherit",
  });

  if (result.error) {
    throw new Error(
      `Failed to run resolve.installCommand (${resolve.installCommand}): ${result.error.message}`,
    );
  }

  if (result.status !== 0) {
    throw new Error(
      `resolve.installCommand failed with exit code ${result.status ?? "unknown"}: ${resolve.installCommand}`,
    );
  }

  if (!hasReachableNodeModules(configDir)) {
    throw new Error(
      `resolve.installCommand completed but did not create node_modules. Recontent requires node_modules for TypeScript package resolution.`,
    );
  }

  logger.debug("Dependency installation completed and node_modules is reachable.");
}
