import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { ConfigLoadError, loadConfig, resolveConfigPath } from "../dist/index.mjs";

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

async function withFixture(files, run) {
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
    assert.equal(config.registry.size, 1);
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
      assert.equal(config.registry.size, 1);
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
      assert.equal(config.registry.size, 1);
    },
  );
});

test("rejects invalid configuration exports", async () => {
  await withFixture({ "recontent.config.ts": "export default {};" }, async (directory) => {
    await assert.rejects(loadConfig(path.join(directory, "recontent.config.ts")), ConfigLoadError);
  });
});

test("resolves relative, absolute, and home config paths", () => {
  assert.equal(resolveConfigPath("/tmp/recontent.config.ts"), "/tmp/recontent.config.ts");
  assert.equal(
    resolveConfigPath("~/recontent.config.ts"),
    path.join(process.env.HOME, "recontent.config.ts"),
  );
  assert.equal(
    resolveConfigPath("recontent.config.ts"),
    path.resolve(process.cwd(), "recontent.config.ts"),
  );
});
