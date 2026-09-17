import type { ThemeOverride, TokenRegistry } from "@recontentapp/core";

/** Structural subset of `Config`/`PluginContext` every generator needs. Both
 *  types are assignable to this, so generators work unchanged whether called
 *  from a legacy `Config` or from a plugin's `PluginContext`. */
export type GeneratorContext = {
  registry: TokenRegistry;
  themes: Record<string, ThemeOverride>;
};
