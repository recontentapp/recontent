import fs from "node:fs";
import path from "node:path";
import type { ComponentInfo } from "@recontentapp/core";

/** Bumped when the shape below changes. */
const FORMAT = 1;

type FileStamp = [path: string, mtimeMs: number, size: number];

type CacheFile = {
  format: number;
  /** Everything but the files that the result depends on: versions, config, git HEAD. */
  key: string;
  files: FileStamp[];
  components: ComponentInfo[];
  warnings: string[];
};

export type Cached = Pick<CacheFile, "components" | "warnings"> & { files: string[] };

function cachePath(root: string): string {
  return path.join(root, ".recontent", "cache.json");
}

function stamp(file: string): FileStamp | undefined {
  const stats = fs.statSync(file, { throwIfNoEntry: false });
  return stats && [file, stats.mtimeMs, stats.size];
}

/**
 * The result of the last introspection, if `key` and every file it was
 * computed from are unchanged. Anything unreadable or unexpected is a miss.
 *
 * Not detected: a new file that changes module resolution without touching an
 * existing one (adding `button.ts` next to `button/index.ts`).
 */
export function readCache(root: string, key: string): Cached | undefined {
  try {
    const cache = JSON.parse(fs.readFileSync(cachePath(root), "utf-8")) as CacheFile;
    if (cache.format !== FORMAT || cache.key !== key) return undefined;
    const unchanged = cache.files.every(([file, mtimeMs, size]) => {
      const current = stamp(file);
      return current?.[1] === mtimeMs && current[2] === size;
    });
    return unchanged
      ? {
          components: cache.components,
          warnings: cache.warnings,
          files: cache.files.map(([file]) => file),
        }
      : undefined;
  } catch {
    return undefined;
  }
}

/** Best effort: a read-only checkout must still build. Atomic, so a concurrent reader never sees half a file. */
export function writeCache(
  root: string,
  key: string,
  result: Pick<CacheFile, "components" | "warnings"> & { files: string[] },
): void {
  try {
    const stamps = result.files.map(stamp);
    if (stamps.some((entry) => entry === undefined)) return;
    const cache: CacheFile = {
      format: FORMAT,
      key,
      files: stamps as FileStamp[],
      components: result.components,
      warnings: result.warnings,
    };

    const file = cachePath(root);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    // Keeps the directory out of version control without touching the user's .gitignore.
    fs.writeFileSync(path.join(path.dirname(file), ".gitignore"), "*\n");
    const temporary = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(cache));
    fs.renameSync(temporary, file);
  } catch {
    // A cache that cannot be written is a cache that is missed next time.
  }
}
