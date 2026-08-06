import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@jest/globals";
import {
  computeRequiredDependencies,
  resolveDependencyDiagnostics,
} from "../src/cli/doctor/check-dependencies.js";
import { defineConfig, defineReferenceTokens, defineSystemTokens } from "../src/index.js";

const configDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("a config whose only outputs are the typescript targets requires no dependencies", () => {
  const config = defineConfig({
    tokens: {
      ref: defineReferenceTokens({}),
      system: defineSystemTokens({}),
      components: {},
    },
    output: [
      { target: "typescript", outDir: "dist-test-ts" },
      { target: "typescript-native", outDir: "dist-test-native" },
    ],
  });
  expect(computeRequiredDependencies(config)).toEqual({});
});

test("resolveDependencyDiagnostics is empty when the installed version satisfies the range", () => {
  const diagnostics = resolveDependencyDiagnostics(configDir, {
    "@vanilla-extract/css": "^1.17.0",
  });
  expect(diagnostics).toEqual([]);
});

test("resolveDependencyDiagnostics flags a version that doesn't satisfy the range", () => {
  const diagnostics = resolveDependencyDiagnostics(configDir, {
    "@vanilla-extract/css": ">=99.0.0",
  });
  expect(diagnostics).toHaveLength(1);
  expect(diagnostics[0]!.message).toMatch(/does not satisfy required range/);
});

test("resolveDependencyDiagnostics flags a package that isn't installed", () => {
  const diagnostics = resolveDependencyDiagnostics(configDir, {
    "left-pad-definitely-not-installed": "^1.0.0",
  });
  expect(diagnostics).toHaveLength(1);
  expect(diagnostics[0]!.message).toMatch(/Missing dependency/);
});
