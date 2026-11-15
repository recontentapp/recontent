import type { IntrospectionConfigInput } from "../introspection/model.js";
import type { LogLevel } from "../logger.js";
import type { RecontentPlugin } from "../plugins/types.js";
import type { ThemeOverride, TokenDiagnostic, TokenRegistry } from "../token-model/registry.js";

export type Config = {
  registry: TokenRegistry;
  diagnostics: TokenDiagnostic[];
  themes: Record<string, ThemeOverride>;
  plugins: RecontentPlugin[];
  logLevel: LogLevel;
  introspection?: IntrospectionConfigInput;
};
