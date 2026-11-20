import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/** Resolves `filePath` against `baseDir`, rejecting anything that lands outside it. */
function resolveOutputPath(filePath: string, baseDir: string): string {
  const resolved = path.resolve(baseDir, filePath);
  const relative = path.relative(baseDir, resolved);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write "${filePath}": it resolves outside of ${baseDir}.`);
  }
  return resolved;
}

/**
 * Writes `content` to `filePath`, resolved against the explicit `baseDir`
 * (never `process.cwd()` — callers own that decision). Paths outside `baseDir`
 * are rejected, and a file that already holds `content` is left untouched so
 * file watchers (HMR) don't fire for unchanged output.
 */
export async function writeOutputFile(
  filePath: string,
  content: string,
  baseDir: string,
  options?: { writeMode?: "always" | "once" },
): Promise<{ path: string; written: boolean; skipReason?: "exists" | "unchanged" }> {
  const resolved = resolveOutputPath(filePath, baseDir);

  const existing = await readFile(resolved, "utf8").catch(() => undefined);
  if (existing !== undefined && (options?.writeMode === "once" || existing === content)) {
    return {
      path: resolved,
      written: false,
      skipReason: options?.writeMode === "once" ? "exists" : "unchanged",
    };
  }

  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, content, "utf8");
  return { path: resolved, written: true };
}

/**
 * What `writeOutputFile` would leave on disk, without touching it: `missing` if the
 * file is absent, `stale` if its content differs. A write-once file is `fresh` as
 * soon as it exists, since users are expected to edit it.
 */
export async function checkOutputFile(
  filePath: string,
  content: string,
  baseDir: string,
  options?: { writeMode?: "always" | "once" },
): Promise<{ path: string; status: "fresh" | "stale" | "missing" }> {
  const resolved = resolveOutputPath(filePath, baseDir);
  const existing = await readFile(resolved, "utf8").catch(() => undefined);
  if (existing === undefined) return { path: resolved, status: "missing" };
  const fresh = options?.writeMode === "once" || existing === content;
  return { path: resolved, status: fresh ? "fresh" : "stale" };
}

/** `filePath` as shown to users: relative to `cwd`, so output doesn't differ between machines. */
export function displayPath(cwd: string, filePath: string): string {
  return path.relative(cwd, filePath) || ".";
}
