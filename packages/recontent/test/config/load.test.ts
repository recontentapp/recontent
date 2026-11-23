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

test.each([
  ["a config that does not export a configuration", "export default {};"],
  ["a config the loader cannot parse", "export default from syntax error("],
])("rejects %s with a ConfigLoadError", async (_name, source) => {
  await withFixture({ "recontent.config.ts": source }, async (directory) => {
    await expect(loadConfig(path.join(directory, "recontent.config.ts"))).rejects.toBeInstanceOf(
      ConfigLoadError,
    );
  });
});

test("a directory is not a config file", async () => {
  await withFixture({ "configs/.keep": "" }, async (directory) => {
    await expect(loadConfig(path.join(directory, "configs"))).rejects.toThrow(
      /Config file not found/,
    );
  });
});

test.each<[string, string, { cwd: string } | undefined]>([
  ["/tmp/recontent.config.ts", "/tmp/recontent.config.ts", undefined],
  ["~/recontent.config.ts", path.join(os.homedir(), "recontent.config.ts"), undefined],
  ["recontent.config.ts", path.resolve(process.cwd(), "recontent.config.ts"), undefined],
  ["~", os.homedir(), undefined],
  // Only ~ and ~/ are expanded; ~user stays literal.
  ["~config.ts", path.resolve(process.cwd(), "~config.ts"), undefined],
  [
    "recontent.config.ts",
    path.join("/tmp/some/dir", "recontent.config.ts"),
    { cwd: "/tmp/some/dir" },
  ],
])("resolveConfigPath(%s) is %s", (input, expected, options) => {
  expect(resolveConfigPath(input, options)).toBe(expected);
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
