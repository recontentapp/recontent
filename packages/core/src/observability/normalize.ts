import type { NormalizedObservabilityConfig, ObservabilityConfigInput } from "./types.js";

export const OBSERVABILITY_SCHEMA_VERSION = "1";

const DEFAULT_PROGRAM_BATCH_SIZE = 25;
const MAX_PROGRAM_BATCH_SIZE = 100;

export function normalizeObservabilityConfig(
  input: ObservabilityConfigInput,
): NormalizedObservabilityConfig {
  const globPattern = Array.isArray(input.globPattern) ? input.globPattern : [input.globPattern];
  const programBatchSize =
    Number.isFinite(input.programBatchSize) && input.programBatchSize !== undefined
      ? Math.min(MAX_PROGRAM_BATCH_SIZE, Math.max(1, Math.floor(input.programBatchSize)))
      : DEFAULT_PROGRAM_BATCH_SIZE;

  return {
    tsConfigPath: input.tsConfigPath,
    globPattern,
    ignoreGlobPattern: input.ignoreGlobPattern ?? [
      "**/*.test.tsx",
      "**/*.test.ts",
      "**/*.spec.tsx",
      "**/*.spec.ts",
      "**/*.stories.tsx",
      "**/*.stories.ts",
    ],
    componentsConfigPath: input.componentsConfigPath,
    codeownersPath: input.codeownersPath,
    programBatchSize,
    profile: input.profile ?? false,
  };
}
