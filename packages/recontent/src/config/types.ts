import type { IntrospectionConfigInput } from "../introspection/model.js";
import type { LogLevel } from "../logger.js";
import type { RecontentPlugin } from "../plugins/types.js";
import type {
  ThemeAxis,
  TokenDiagnostic,
  TokenGroups,
  TokenRegistry,
} from "../token-model/registry.js";

export type Config = {
  registry: TokenRegistry;
  groups: TokenGroups;
  diagnostics: TokenDiagnostic[];
  themes: ThemeAxis[];
  plugins: RecontentPlugin[];
  logLevel: LogLevel;
  introspection?: IntrospectionConfigInput;
};
