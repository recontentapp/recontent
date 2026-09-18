import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Writes `content` to `filePath`, resolved against the explicit `baseDir`
 * (never `process.cwd()` — callers own that decision; see §1/§2 of the CLI
 * ergonomics pass).
 */
export async function writeOutputFile(
  filePath: string,
  content: string,
  baseDir: string,
  options?: { writeMode?: "always" | "once" },
): Promise<{ path: string; written: boolean }> {
  const resolved = path.resolve(baseDir, filePath);

  if (options?.writeMode === "once" && existsSync(resolved)) {
    return { path: resolved, written: false };
  }

  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, content, "utf8");
  return { path: resolved, written: true };
}
