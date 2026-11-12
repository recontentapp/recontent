import path from "node:path";
import type {
  ComponentInfo,
  Config,
  EmittedFile,
  Logger,
  PluginContext,
  PluginDiagnostic,
  RecontentPlugin,
  TypeInfo,
} from "@recontentapp/core";

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

function consumesComponents(plugin: RecontentPlugin): boolean {
  return plugin.dependsOn.includes("introspection") || plugin.dependsOn.includes("introspection?");
}

/**
 * Whether the project needs introspecting: it has an `introspection` block and
 * a plugin consumes components. A plugin that requires them (`"introspection"`,
 * not `"introspection?"`) while the config has no block is a config error.
 */
export function needsComponents(config: Config): boolean {
  const required = config.plugins.find((plugin) => plugin.dependsOn.includes("introspection"));
  if (required && !config.introspection) {
    throw new Error(
      `\`${required.name}\` depends on introspection; add \`introspection\` to defineConfig().`,
    );
  }
  return config.introspection !== undefined && config.plugins.some(consumesComponents);
}

export type RunPluginsOptions = {
  root: string;
  mode: PluginContext["mode"];
  logger: Logger;
  /** Handed to the plugins that depend on components. */
  components?: ComponentInfo[];
  /** The types `components` reference; handed over with them. */
  types?: TypeInfo[];
  /** Why `components` is missing: the plugins that depend on it fail with this message, the others still run. */
  componentsError?: string;
};

export type RunPluginsResult = {
  files: EmittedFile[];
  diagnostics: PluginDiagnostic[];
  /** Plugins that could not run, as `[plugin] message`. Their absence does not stop the other plugins' files. */
  failures: string[];
};

export async function runPlugins(
  config: Config,
  options: RunPluginsOptions,
): Promise<RunPluginsResult> {
  const failures: string[] = [];
  const plugins = sortPlugins(config.plugins).filter((plugin) => {
    const blocked = options.componentsError !== undefined && consumesComponents(plugin);
    if (blocked) failures.push(`[${plugin.name}] ${options.componentsError}`);
    return !blocked;
  });
  const base: PluginContext = {
    registry: config.registry,
    themes: config.themes,
    root: options.root,
    logger: options.logger,
    mode: options.mode,
  };
  const contextFor = (plugin: RecontentPlugin): PluginContext =>
    consumesComponents(plugin)
      ? { ...base, components: options.components, types: options.types }
      : base;

  for (const plugin of plugins) {
    await plugin.buildStart?.(contextFor(plugin));
  }

  const diagnostics: PluginDiagnostic[] = [];
  for (const plugin of plugins) {
    if (!plugin.validate) continue;
    diagnostics.push(...(await plugin.validate(contextFor(plugin))));
  }

  if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    return { files: [], diagnostics, failures };
  }

  const files: EmittedFile[] = [];
  const owners = new Map<string, string>();
  for (const plugin of plugins) {
    if (!plugin.generate) continue;
    const pluginFiles = await plugin.generate(contextFor(plugin));
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
    await plugin.buildEnd?.({ ...contextFor(plugin), files });
  }

  return { files, diagnostics, failures };
}
