/** @type {import('jest').Config} */
export default {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  globalSetup: "<rootDir>/test/helpers/isolate-git.ts",
  testMatch: ["<rootDir>/test/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": [
      "@swc/jest",
      {
        module: { type: "es6" },
        jsc: {
          parser: { syntax: "typescript" },
          target: "es2022",
        },
      },
    ],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@recontentapp/core$": "<rootDir>/../core/src/index.ts",
  },
};
