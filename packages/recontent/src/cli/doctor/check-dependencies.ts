import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import semver from "semver";
import type { Config, PluginContext } from "@recontentapp/core";
import { createLogger } from "../../logger.js";

export type DependencyDiagnostic = {
  packageName: string;
  message: string;
};

export function computeRequiredDependencies(config: Config): Record<string, string> {
  const dependencies: Record<string, string> = {};
  const ctx: PluginContext = {
    registry: config.registry,
    themes: config.themes,
    root: process.cwd(),
    logger: createLogger(config.logLevel),
    mode: "check",
  };

  for (const plugin of config.plugins) {
    Object.assign(dependencies, plugin.dependencies?.(ctx) ?? {});
  }

  return dependencies;
}

function resolveInstalledVersion(configDir: string, packageName: string): string | undefined {
  const requireFromConfig = createRequire(
    pathToFileURL(path.join(configDir, "__recontent_loader__.js")).href,
  );

  try {
    const manifestPath = requireFromConfig.resolve(`${packageName}/package.json`);
    const manifest = requireFromConfig(manifestPath) as { version?: string };
    return manifest.version;
  } catch {
    return undefined;
  }
}

export function resolveDependencyDiagnostics(
  configDir: string,
  required: Record<string, string>,
): DependencyDiagnostic[] {
  const diagnostics: DependencyDiagnostic[] = [];

  for (const [packageName, range] of Object.entries(required)) {
    const installedVersion = resolveInstalledVersion(configDir, packageName);

    if (!installedVersion) {
      diagnostics.push({
        packageName,
        message: `Missing dependency "${packageName}" (required "${range}"). Install it to use the configured built-in components.`,
      });
      continue;
    }

    if (!semver.satisfies(installedVersion, range)) {
      diagnostics.push({
        packageName,
        message: `Installed "${packageName}@${installedVersion}" does not satisfy required range "${range}".`,
      });
    }
  }

  return diagnostics;
}

export function checkDependencies(configDir: string, config: Config): DependencyDiagnostic[] {
  return resolveDependencyDiagnostics(configDir, computeRequiredDependencies(config));
}
