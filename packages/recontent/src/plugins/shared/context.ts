import type { Logger } from "../../logger.js";
import type { ThemeAxis, TokenGroups, TokenRegistry } from "../../token-model/registry.js";

/** Structural subset of `Config`/`PluginContext` every generator needs. Both
 *  types are assignable to this, so generators work unchanged whether called
 *  from a legacy `Config` or from a plugin's `PluginContext`. */
export type GeneratorContext = {
  registry: TokenRegistry;
  /** Absent when only a registry is at hand, e.g. when building a snapshot. */
  groups?: TokenGroups;
  themes: ThemeAxis[];
  logger?: Logger;
};

/** A file a generator produces, named relative to the plugin's `outDir`. */
export type OutputFile = { filename: string; content: string; writeMode?: "always" | "once" };
