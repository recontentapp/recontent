/**
 * Helpers for the specs that invoke the built CLI binary (dist/cli/bin.mjs) as
 * a subprocess, the same way a real user would, and assert on exit codes,
 * stdout/stderr, and files written to disk.
 *
 * Requires `pnpm build` to have run first (CI's `test` job depends on
 * `build` and downloads its artifacts before running `pnpm test`).
 *
 * Fixtures live under `test/fixtures/**` and are copied into a scratch
 * directory nested inside the repo (rather than under the OS tmpdir) so that
 * `require.resolve("recontent")` — which the CLI uses to load configs —
 * finds this workspace's `node_modules/recontent` symlink by walking up
 * parent directories.
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll } from "@jest/globals";

const dirname = path.dirname(fileURLToPath(import.meta.url));
export const packageRoot = path.resolve(dirname, "../..");
export const binPath = path.join(packageRoot, "dist/cli/bin.mjs");
const fixturesDir = path.join(packageRoot, "test/fixtures");
export const scratchRoot = path.join(packageRoot, "test/.e2e-tmp");

const created: string[] = [];

/**
 * Registers the hooks every CLI spec needs: fail early when the binary is not
 * built, and remove the scratch directories the file created once it is done
 * (so a project built in `beforeAll` outlives the tests). The scratch root
 * itself is shared with specs running in other workers, so it is left alone.
 */
export function useCliScratch(): void {
  beforeAll(() => {
    if (!existsSync(binPath)) {
      throw new Error(`${binPath} does not exist. Run "pnpm build" before running this test file.`);
    }
  });

  afterAll(() => {
    for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true });
  });
}

export function makeScratchDir(prefix: string): string {
  mkdirSync(scratchRoot, { recursive: true });
  const dir = mkdtempSync(path.join(scratchRoot, `${prefix}-`));
  created.push(dir);
  return dir;
}

export function copyFixture(name: string, destDir: string): void {
  cpSync(path.join(fixturesDir, name), destDir, { recursive: true });
}

export function runCli(args: string[], options?: { cwd?: string; env?: NodeJS.ProcessEnv }) {
  const result = spawnSync("node", [binPath, ...args], {
    cwd: options?.cwd ?? packageRoot,
    encoding: "utf-8",
    env: options?.env ? { ...process.env, ...options.env } : process.env,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

/**
 * `react`'s types are installed in the package, not in a scratch project: link
 * them the way a project's own `node_modules` would hold them, so that
 * introspection has something to find.
 */
export function linkReactTypes(dir: string): void {
  mkdirSync(path.join(dir, "node_modules/@types"), { recursive: true });
  symlinkSync(
    path.join(packageRoot, "node_modules/@types/react"),
    path.join(dir, "node_modules/@types/react"),
  );
}
