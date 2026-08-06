import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createJiti } from "jiti";
import ts from "typescript";
import type { Config } from "./types.js";

export const DEFAULT_CONFIG = "recontent.config.ts";

export class ConfigLoadError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ConfigLoadError";
  }
}

function getTsconfigAliases(cwd: string): Record<string, string> {
  const tsConfigPath = path.resolve(cwd, "tsconfig.json");
  if (!fs.existsSync(tsConfigPath)) return {};

  const configFile = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
  if (configFile.error) return {};

  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, cwd);
  const aliases: Record<string, string> = {};
  const paths = parsed.options.paths ?? {};
  const baseUrl = parsed.options.baseUrl ? path.resolve(cwd, String(parsed.options.baseUrl)) : cwd;

  for (const [key, values] of Object.entries(paths)) {
    const pattern = key.replace(/\/\*$/, "");
    const target = values[0]?.replace(/\/\*$/, "");
    if (target) aliases[pattern] = path.resolve(baseUrl, target);
  }
  return aliases;
}

function getRecontentAlias(configDir: string): string {
  const requireFromConfig = createRequire(
    pathToFileURL(path.join(configDir, "__recontent_loader__.js")).href,
  );
  try {
    return requireFromConfig.resolve("recontent");
  } catch (cause) {
    throw new ConfigLoadError(
      `Could not resolve "recontent" from "${configDir}". Install recontent before loading this config.`,
      { cause },
    );
  }
}

function isConfig(value: unknown): value is Config {
  return (
    typeof value === "object" &&
    value !== null &&
    "registry" in value &&
    value.registry instanceof Map &&
    "themes" in value &&
    typeof value.themes === "object" &&
    value.themes !== null
  );
}

function extractConfig(module: Record<string, unknown>): unknown {
  if ("default" in module && module.default !== undefined) return module.default;
  if ("config" in module && module.config !== undefined) return module.config;
  return undefined;
}

export function resolveConfigPath(configArg: string): string {
  if (configArg.startsWith("~/")) return path.join(os.homedir(), configArg.slice(2));
  if (configArg.startsWith("~")) return path.join(os.homedir(), configArg.slice(1));
  if (path.isAbsolute(configArg)) return configArg;
  return path.resolve(process.cwd(), configArg);
}

export async function loadConfig(
  configPath?: string,
  options?: { resolveFrom?: string },
): Promise<Config> {
  const resolved = resolveConfigPath(configPath ?? DEFAULT_CONFIG);
  const configDir = options?.resolveFrom ?? path.dirname(resolved);

  let module: Record<string, unknown>;
  try {
    const jiti = createJiti(import.meta.url, {
      interopDefault: true,
      alias: {
        recontent: getRecontentAlias(configDir),
        ...getTsconfigAliases(configDir),
      },
    });
    module = (await jiti.import(resolved)) as Record<string, unknown>;
  } catch (cause) {
    if (cause instanceof ConfigLoadError) throw cause;
    const message = cause instanceof Error ? cause.message : "Unknown error loading config";
    throw new ConfigLoadError(
      `Failed to load config at "${resolved}": ${message}\nMake sure recontent.config.ts exists and exports the result of defineConfig().`,
      { cause },
    );
  }

  const config = extractConfig(module);
  if (!isConfig(config)) {
    throw new ConfigLoadError(
      `Invalid config at "${resolved}". Expected the default export (or named "config" export) to be the result of defineConfig().`,
    );
  }
  return config;
}
