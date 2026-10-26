import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { ComponentInfo } from "@recontentapp/core";

/** Bumped when the shape below changes. */
const FORMAT = 2;

type FileStamp = [path: string, mtimeMs: number, size: number];

type CacheFile = {
  format: number;
  /** Everything but the files that the result depends on: versions, config, git HEAD. */
  key: string;
  files: FileStamp[];
  /** Directories of the project's own files: adding a file bumps its directory's mtime. */
  directories: FileStamp[];
  components: ComponentInfo[];
  warnings: string[];
};

export type Cached = Pick<CacheFile, "components" | "warnings"> & { files: string[] };

/** One file per config, so that two configs in the same directory don't evict each other. */
function cachePath(root: string, configPath: string): string {
  const id = crypto.createHash("sha256").update(path.resolve(configPath)).digest("hex").slice(0, 8);
  return path.join(root, ".recontent", `cache-${id}.json`);
}

function stamp(file: string): FileStamp | undefined {
  const stats = fs.statSync(file, { throwIfNoEntry: false });
  return stats && [file, stats.mtimeMs, stats.size];
}

/**
 * The result of the last introspection, if `key` and every file it was
 * computed from are unchanged. Anything unreadable or unexpected is a miss.
 *
 * Not detected: a new file that changes module resolution outside the
 * directories of the project's own files, or in a dependency's.
 */
export function readCache(root: string, configPath: string, key: string): Cached | undefined {
  try {
    const cache = JSON.parse(fs.readFileSync(cachePath(root, configPath), "utf-8")) as CacheFile;
    if (cache.format !== FORMAT || cache.key !== key) return undefined;
    const unchanged = [...cache.files, ...cache.directories].every(([file, mtimeMs, size]) => {
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
  configPath: string,
  key: string,
  result: Pick<CacheFile, "components" | "warnings"> & { files: string[]; directories: string[] },
): void {
  try {
    const files = result.files.map(stamp);
    const directories = result.directories.map(stamp);
    if ([...files, ...directories].some((entry) => entry === undefined)) return;
    const cache: CacheFile = {
      format: FORMAT,
      key,
      files: files as FileStamp[],
      directories: directories as FileStamp[],
      components: result.components,
      warnings: result.warnings,
    };

    const file = cachePath(root, configPath);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    // Keeps the directory out of version control without touching the user's .gitignore.
    // `wx`: never overwrites an existing file, nor follows a symlink planted in its place.
    try {
      fs.writeFileSync(path.join(path.dirname(file), ".gitignore"), "*\n", { flag: "wx" });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    const temporary = `${file}.${crypto.randomBytes(6).toString("hex")}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(cache), { flag: "wx" });
    fs.renameSync(temporary, file);
  } catch {
    // A cache that cannot be written is a cache that is missed next time.
  }
}
