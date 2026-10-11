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

function getRecontentAliases(configDir: string): Record<string, string> {
  const requireFromConfig = createRequire(
    pathToFileURL(path.join(configDir, "__recontent_loader__.js")).href,
  );
  try {
    const aliases: Record<string, string> = { recontent: requireFromConfig.resolve("recontent") };
    try {
      aliases["recontent/plugins"] = requireFromConfig.resolve("recontent/plugins");
    } catch {
      // Optional subpath — only used by configs that import plugin factories.
    }
    return aliases;
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
    value.themes !== null &&
    "plugins" in value &&
    Array.isArray(value.plugins)
  );
}

function extractConfig(module: Record<string, unknown>): unknown {
  if ("default" in module && module.default !== undefined) return module.default;
  if ("config" in module && module.config !== undefined) return module.config;
  return undefined;
}

export function resolveConfigPath(configArg: string, options?: { cwd?: string }): string {
  if (configArg.startsWith("~/")) return path.join(os.homedir(), configArg.slice(2));
  if (configArg.startsWith("~")) return path.join(os.homedir(), configArg.slice(1));
  if (path.isAbsolute(configArg)) return configArg;
  return path.resolve(options?.cwd ?? process.cwd(), configArg);
}

const DISCOVERABLE_CONFIG_NAMES = [
  "recontent.config.ts",
  "recontent.config.mts",
  "recontent.config.js",
  "recontent.config.mjs",
];

/**
 * Searches upward from `cwd` for a `recontent.config.{ts,mts,js,mjs}` file,
 * so `recontent` can be invoked from a subdirectory of a project (or the
 * root of a monorepo) without an explicit `-c/--config`. The search stops at
 * the filesystem root, or at the first directory that has a `package.json`
 * but no config of its own — so it doesn't wander into an unrelated
 * ancestor project.
 */
export function discoverConfigPath(cwd: string): string {
  const searched: string[] = [];
  let current = path.resolve(cwd);

  while (true) {
    searched.push(current);

    for (const name of DISCOVERABLE_CONFIG_NAMES) {
      const candidate = path.join(current, name);
      if (fs.existsSync(candidate)) return candidate;
    }

    if (fs.existsSync(path.join(current, "package.json"))) break;

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  throw new ConfigLoadError(
    `Could not find a recontent.config.{ts,mts,js,mjs} file. Searched:\n${searched
      .map((dir) => `  - ${dir}`)
      .join("\n")}\nPass -c/--config to point at one explicitly.`,
  );
}

export async function loadConfig(
  configPath?: string,
  options?: { resolveFrom?: string },
): Promise<Config> {
  const resolved = resolveConfigPath(configPath ?? DEFAULT_CONFIG);
  if (!fs.existsSync(resolved)) {
    throw new ConfigLoadError(`Config file not found: "${resolved}".`);
  }
  const configDir = options?.resolveFrom ?? path.dirname(resolved);

  let module: Record<string, unknown>;
  try {
    const jiti = createJiti(import.meta.url, {
      interopDefault: true,
      alias: {
        ...getRecontentAliases(configDir),
        ...getTsconfigAliases(configDir),
      },
    });
    module = (await jiti.import(resolved)) as Record<string, unknown>;
  } catch (cause) {
    if (cause instanceof ConfigLoadError) throw cause;
    const message = cause instanceof Error ? cause.message : "Unknown error loading config";
    throw new ConfigLoadError(`Failed to load config at "${resolved}": ${message}`, { cause });
  }

  const config = extractConfig(module);
  if (!isConfig(config)) {
    throw new ConfigLoadError(
      `Invalid config at "${resolved}". Expected the default export (or named "config" export) to be the result of defineConfig().`,
    );
  }
  return config;
}
