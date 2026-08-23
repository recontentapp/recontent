import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import semver from "semver";
import type { Config } from "@recontentapp/core";
import {
  getBuiltInComponentDependencies,
  normalizeBuiltInComponents,
} from "../../registry/index.js";

export type DependencyDiagnostic = {
  packageName: string;
  message: string;
};

export function computeRequiredDependencies(config: Config): Record<string, string> {
  const dependencies: Record<string, string> = {};

  for (const output of config.output) {
    if (output.target !== "vanilla-extract") continue;

    const selection = normalizeBuiltInComponents(output.builtInComponents);
    if (selection.names.length === 0) continue;

    Object.assign(
      dependencies,
      getBuiltInComponentDependencies(selection.names, "vanilla-extract"),
    );
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
