import type { Logger } from "../../logger.js";
import type { ThemeOverride, TokenRegistry } from "../../token-model/registry.js";

/** Structural subset of `Config`/`PluginContext` every generator needs. Both
 *  types are assignable to this, so generators work unchanged whether called
 *  from a legacy `Config` or from a plugin's `PluginContext`. */
export type GeneratorContext = {
  registry: TokenRegistry;
  themes: Record<string, ThemeOverride>;
  logger?: Logger;
};

/** A file a generator produces, named relative to the plugin's `outDir`. */
export type OutputFile = { filename: string; content: string; writeMode?: "always" | "once" };
