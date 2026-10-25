import type { TokenRegistry, ThemeOverride } from "../tokens/registry.js";
import type { Logger } from "../logger.js";
import type { ComponentManifest } from "../introspection/types.js";
import type { GitInfo } from "../git/types.js";

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
  /** Present when the config sets `introspection`. */
  components?: ComponentManifest;
  /** Present when the root is inside a git work tree. */
  git?: GitInfo;
};

export interface RecontentPlugin {
  /** Namespaced, e.g. "recontent:stylex" or "acme:a11y-contrast". Used in logs,
   *  diagnostics and file-collision errors. */
  name: string;
  /** Vite semantics: "pre" runs before unenforced plugins, "post" after. */
  enforce?: "pre" | "post";

  buildStart?(ctx: PluginContext): void | Promise<void>;
  /** Errors abort the build before anything is written. */
  validate?(ctx: PluginContext): PluginDiagnostic[] | Promise<PluginDiagnostic[]>;
  generate?(ctx: PluginContext): EmittedFile[] | Promise<EmittedFile[]>;
  buildEnd?(ctx: PluginContext & { files: EmittedFile[] }): void | Promise<void>;
}
