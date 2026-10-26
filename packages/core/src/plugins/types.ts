import type { TokenRegistry, ThemeOverride } from "../tokens/registry.js";
import type { Logger } from "../logger.js";
import type { ComponentInfo } from "../introspection/types.js";

/** A file a plugin wants written. `path` is relative to the project root — the
 *  plugin, not the CLI, owns its outDir. */
export type EmittedFile = {
  path: string;
  content: string;
  writeMode?: "always" | "once";
};

export type PluginDiagnostic = {
  severity: "error" | "warning";
  message: string;
  /** Token path, when the diagnostic is token-scoped. */
  path?: string[];
};

export type PluginContext = {
  registry: TokenRegistry;
  themes: Record<string, ThemeOverride>;
  /** Absolute path to the directory containing recontent.config.ts. */
  root: string;
  logger: Logger;
  mode: "build" | "watch" | "check";
  /** Sorted by name. Only set for plugins that declare `"components"` or `"components?"` in `dependsOn`, and only when `introspection` is configured. */
  components?: ComponentInfo[];
};

export interface RecontentPlugin {
  /** Namespaced, e.g. "recontent:stylex" or "acme:a11y-contrast". Used in logs,
   *  diagnostics and file-collision errors. */
  name: string;
  /** Vite semantics: "pre" runs before unenforced plugins, "post" after. */
  enforce?: "pre" | "post";
  /** What the plugin consumes. `"components"` requires `introspection` in defineConfig(); `"components?"`
   *  uses the components when it is configured and works without them otherwise. Either way it is the
   *  only way `ctx.components` gets filled in. */
  dependsOn: ("tokens" | "components" | "components?")[];

  buildStart?(ctx: PluginContext): void | Promise<void>;
  /** Errors abort the build before anything is written. */
  validate?(ctx: PluginContext): PluginDiagnostic[] | Promise<PluginDiagnostic[]>;
  generate?(ctx: PluginContext): EmittedFile[] | Promise<EmittedFile[]>;
  buildEnd?(ctx: PluginContext & { files: EmittedFile[] }): void | Promise<void>;
}
