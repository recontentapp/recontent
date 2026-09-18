import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@jest/globals";
import {
  ConfigLoadError,
  discoverConfigPath,
  loadConfig,
  resolveConfigPath,
} from "../../src/config/load.js";

const configSource = `
  import { defineConfig, tokens } from "recontent";
  export default defineConfig({
    tokens: {
      ref: {},
      system: {},
      components: { color: tokens.color("#ffffff") },
    },
  });
`;

async function withFixture(
  files: Record<string, string>,
  run: (directory: string) => Promise<void>,
) {
  const directory = await mkdtemp(path.join(process.cwd(), "test/fixture-"));
  try {
    await Promise.all(
      Object.entries(files).map(async ([file, content]) => {
        const target = path.join(directory, file);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, content);
      }),
    );
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("loads a default config exporting recontent definitions", async () => {
  await withFixture({ "recontent.config.ts": configSource }, async (directory) => {
    const config = await loadConfig(path.join(directory, "recontent.config.ts"));
    expect(config.registry.size).toBe(1);
  });
});

test("loads a named config export", async () => {
  await withFixture(
    {
      "recontent.config.ts": configSource.replace(
        "export default",
        "export { config }; const config =",
      ),
    },
    async (directory) => {
      const config = await loadConfig(path.join(directory, "recontent.config.ts"));
      expect(config.registry.size).toBe(1);
    },
  );
});

test("honors TypeScript path aliases", async () => {
  await withFixture(
    {
      "tsconfig.json": JSON.stringify({
        compilerOptions: { baseUrl: ".", paths: { "@fixture/*": ["src/*"] } },
      }),
      "recontent.config.ts": 'export { default } from "@fixture/config";',
      "src/config.ts": configSource,
    },
    async (directory) => {
      const config = await loadConfig(path.join(directory, "recontent.config.ts"));
      expect(config.registry.size).toBe(1);
    },
  );
});

test("rejects invalid configuration exports", async () => {
  await withFixture({ "recontent.config.ts": "export default {};" }, async (directory) => {
    await expect(loadConfig(path.join(directory, "recontent.config.ts"))).rejects.toBeInstanceOf(
      ConfigLoadError,
    );
  });
});

test("wraps loader failures in a ConfigLoadError", async () => {
  await withFixture(
    { "recontent.config.ts": "export default from syntax error(" },
    async (directory) => {
      await expect(loadConfig(path.join(directory, "recontent.config.ts"))).rejects.toBeInstanceOf(
        ConfigLoadError,
      );
    },
  );
});

test("resolves relative, absolute, and home config paths", () => {
  expect(resolveConfigPath("/tmp/recontent.config.ts")).toBe("/tmp/recontent.config.ts");
  expect(resolveConfigPath("~/recontent.config.ts")).toBe(
    path.join(os.homedir(), "recontent.config.ts"),
  );
  expect(resolveConfigPath("recontent.config.ts")).toBe(
    path.resolve(process.cwd(), "recontent.config.ts"),
  );
});

test("resolves a path starting with a bare ~", () => {
  expect(resolveConfigPath("~config.ts")).toBe(path.join(os.homedir(), "config.ts"));
});

test("resolveConfigPath resolves relative paths against an explicit cwd", () => {
  expect(resolveConfigPath("recontent.config.ts", { cwd: "/tmp/some/dir" })).toBe(
    path.join("/tmp/some/dir", "recontent.config.ts"),
  );
});

test("discoverConfigPath finds a config in an ancestor directory", async () => {
  await withFixture(
    {
      "recontent.config.ts": configSource,
      "src/deep/.gitkeep": "",
    },
    async (directory) => {
      const found = discoverConfigPath(path.join(directory, "src", "deep"));
      expect(found).toBe(path.join(directory, "recontent.config.ts"));
    },
  );
});

test("discoverConfigPath stops at a directory with package.json and no config", async () => {
  await withFixture(
    {
      "package.json": "{}",
      "src/.gitkeep": "",
    },
    async (directory) => {
      expect(() => discoverConfigPath(path.join(directory, "src"))).toThrow(ConfigLoadError);
      expect(() => discoverConfigPath(path.join(directory, "src"))).toThrow(/Searched:/);
    },
  );
});
