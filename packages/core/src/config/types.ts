import type { IntrospectionConfigInput } from "../introspection/types.js";
import type { LogLevel } from "../logger.js";
import type { NormalizedObservabilityConfig } from "../observability/types.js";
import type { RecontentPlugin } from "../plugins/types.js";
import type { ThemeOverride, TokenDiagnostic, TokenRegistry } from "../tokens/registry.js";

export type Config = {
  registry: TokenRegistry;
  diagnostics: TokenDiagnostic[];
  themes: Record<string, ThemeOverride>;
  plugins: RecontentPlugin[];
  logLevel: LogLevel;
  observability?: NormalizedObservabilityConfig;
  introspection?: IntrospectionConfigInput;
};
