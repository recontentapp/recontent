import { expect, test } from "@jest/globals";
import { normalizeObservabilityConfig } from "../src/config.js";

const base = {
  tsConfigPath: "tsconfig.json",
  globPattern: "src/**/*.tsx",
  componentsConfigPath: "components.json",
};

test("wraps a single glob pattern into an array", () => {
  const config = normalizeObservabilityConfig(base);
  expect(config.globPattern).toEqual(["src/**/*.tsx"]);
});

test("keeps an array glob pattern as-is", () => {
  const config = normalizeObservabilityConfig({ ...base, globPattern: ["a/**", "b/**"] });
  expect(config.globPattern).toEqual(["a/**", "b/**"]);
});

test("defaults ignoreGlobPattern to test/spec/story files", () => {
  const config = normalizeObservabilityConfig(base);
  expect(config.ignoreGlobPattern).toEqual([
    "**/*.test.tsx",
    "**/*.test.ts",
    "**/*.spec.tsx",
    "**/*.spec.ts",
    "**/*.stories.tsx",
    "**/*.stories.ts",
  ]);
});

test("honors a custom ignoreGlobPattern", () => {
  const config = normalizeObservabilityConfig({ ...base, ignoreGlobPattern: ["**/*.fixture.ts"] });
  expect(config.ignoreGlobPattern).toEqual(["**/*.fixture.ts"]);
});

test("defaults programBatchSize to 25 when unset", () => {
  const config = normalizeObservabilityConfig(base);
  expect(config.programBatchSize).toBe(25);
});

test("clamps programBatchSize to the [1, 100] range", () => {
  expect(normalizeObservabilityConfig({ ...base, programBatchSize: 0 }).programBatchSize).toBe(1);
  expect(normalizeObservabilityConfig({ ...base, programBatchSize: -5 }).programBatchSize).toBe(1);
  expect(normalizeObservabilityConfig({ ...base, programBatchSize: 500 }).programBatchSize).toBe(
    100,
  );
});

test("floors a fractional programBatchSize", () => {
  const config = normalizeObservabilityConfig({ ...base, programBatchSize: 12.9 });
  expect(config.programBatchSize).toBe(12);
});

test("falls back to the default programBatchSize when not finite", () => {
  const config = normalizeObservabilityConfig({ ...base, programBatchSize: NaN });
  expect(config.programBatchSize).toBe(25);
});

test("defaults profile to false", () => {
  expect(normalizeObservabilityConfig(base).profile).toBe(false);
});

test("honors an explicit profile flag", () => {
  expect(normalizeObservabilityConfig({ ...base, profile: true }).profile).toBe(true);
});

test("passes through tsConfigPath, componentsConfigPath and codeownersPath", () => {
  const config = normalizeObservabilityConfig({ ...base, codeownersPath: "CODEOWNERS" });
  expect(config.tsConfigPath).toBe("tsconfig.json");
  expect(config.componentsConfigPath).toBe("components.json");
  expect(config.codeownersPath).toBe("CODEOWNERS");
});
