import type { IntrospectionConfigInput } from "../introspection/types.js";
import type { LogLevel } from "../logger.js";
import type { NormalizedObservabilityConfig } from "../observability/types.js";
import type { Output } from "../outputs/types.js";
import type { ThemeOverride, TokenDiagnostic, TokenRegistry } from "../tokens/registry.js";

export type ResolveConfigInput = {
  packageManager: string;
  installCommand: string;
};

export type Config = {
  registry: TokenRegistry;
  diagnostics: TokenDiagnostic[];
  themes: Record<string, ThemeOverride>;
  output: Output[];
  logLevel: LogLevel;
  resolve?: ResolveConfigInput;
  observability?: NormalizedObservabilityConfig;
  introspection?: IntrospectionConfigInput;
};
