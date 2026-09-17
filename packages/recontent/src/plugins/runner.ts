import path from "node:path";
import type {
  Config,
  EmittedFile,
  PluginContext,
  PluginDiagnostic,
  RecontentPlugin,
} from "@recontentapp/core";
import { MissingDesignTokensError } from "../registry/index.js";

export function sortPlugins(plugins: RecontentPlugin[]): RecontentPlugin[] {
  const pre: RecontentPlugin[] = [];
  const normal: RecontentPlugin[] = [];
  const post: RecontentPlugin[] = [];

  for (const plugin of plugins) {
    if (plugin.enforce === "pre") {
      pre.push(plugin);
    } else if (plugin.enforce === "post") {
      post.push(plugin);
    } else {
      normal.push(plugin);
    }
  }

  return [...pre, ...normal, ...post];
}

export type RunPluginsOptions = {
  root: string;
  mode: PluginContext["mode"];
};

export type RunPluginsResult = {
  files: EmittedFile[];
  diagnostics: PluginDiagnostic[];
};

export async function runPlugins(
  config: Config,
  options: RunPluginsOptions,
): Promise<RunPluginsResult> {
  const plugins = sortPlugins(config.plugins);
  const ctx: PluginContext = {
    registry: config.registry,
    themes: config.themes,
    root: options.root,
    logger: {
      info: (message) => console.log(message),
      warn: (message) => console.warn(message),
      debug: () => {},
    },
    mode: options.mode,
  };

  for (const plugin of plugins) {
    await plugin.buildStart?.(ctx);
  }

  const diagnostics: PluginDiagnostic[] = [];
  for (const plugin of plugins) {
    if (!plugin.validate) continue;
    try {
      const pluginDiagnostics = await plugin.validate(ctx);
      diagnostics.push(...pluginDiagnostics);
    } catch (error) {
      if (error instanceof MissingDesignTokensError) {
        diagnostics.push({ severity: "error", message: `[${plugin.name}] ${error.message}` });
        continue;
      }
      throw error;
    }
  }

  if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    return { files: [], diagnostics };
  }

  const files: EmittedFile[] = [];
  const owners = new Map<string, string>();
  for (const plugin of plugins) {
    if (!plugin.generate) continue;
    let pluginFiles: EmittedFile[];
    try {
      pluginFiles = await plugin.generate(ctx);
    } catch (error) {
      if (error instanceof MissingDesignTokensError) {
        throw new MissingDesignTokensError(
          error.errors.map((message) => `[${plugin.name}] ${message}`),
        );
      }
      throw error;
    }
    for (const file of pluginFiles) {
      const normalized = path.posix.normalize(file.path);
      const owner = owners.get(normalized);
      if (owner !== undefined && owner !== plugin.name) {
        throw new Error(
          `File path collision at "${normalized}": both plugin "${owner}" and plugin "${plugin.name}" emitted this file.`,
        );
      }
      owners.set(normalized, plugin.name);
      files.push(file);
    }
  }

  for (const plugin of plugins) {
    await plugin.buildEnd?.({ ...ctx, files });
  }

  return { files, diagnostics };
}
