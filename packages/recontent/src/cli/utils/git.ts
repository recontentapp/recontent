import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

function run(
  args: string[],
  cwd: string,
): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync("git", args, { cwd, encoding: "utf-8" });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

export function resolveGitRoot(cwd: string): string {
  const result = run(["rev-parse", "--show-toplevel"], cwd);
  if (result.status !== 0) {
    throw new Error(`Not a git repository (or any of the parent directories): ${cwd}`);
  }
  return result.stdout.trim();
}

export function assertRevision(gitRoot: string, rev: string): void {
  const result = run(["rev-parse", "--verify", `${rev}^{commit}`], gitRoot);
  if (result.status !== 0) {
    throw new Error(`Not a valid git revision: "${rev}".`);
  }
}

/**
 * Reproduces the whole tree at `rev` into `destDir` via `git archive | tar -x`.
 * Preferred over `git worktree` — no lock files, no cleanup hazard, and it
 * works on the shallow clones `actions/checkout` produces by default, as
 * long as the rev itself is present.
 */
export function archiveRevision(gitRoot: string, rev: string, destDir: string): void {
  const archive = spawnSync("git", ["archive", rev], {
    cwd: gitRoot,
    maxBuffer: 1024 * 1024 * 1024,
  });
  if (archive.status !== 0) {
    const stderr = archive.stderr ? archive.stderr.toString("utf-8") : "";
    throw new Error(
      `"git archive ${rev}" failed: ${stderr.trim() || `exit code ${archive.status}`}`,
    );
  }

  const tmpTarDir = mkdtempSync(path.join(os.tmpdir(), "recontent-archive-"));
  const tarPath = path.join(tmpTarDir, "archive.tar");
  try {
    // Route through a latin1 string rather than passing the Buffer
    // directly — a byte-for-byte round trip, and it sidesteps a
    // Buffer/ArrayBuffer typing conflict between @types/node versions
    // elsewhere in this workspace.
    writeFileSync(tarPath, archive.stdout.toString("binary"), "binary");
    const extract = spawnSync("tar", ["-x", "-f", tarPath, "-C", destDir]);
    if (extract.status !== 0) {
      const stderr = extract.stderr ? extract.stderr.toString("utf-8") : "";
      throw new Error(
        `Extracting the archive for "${rev}" failed: ${stderr.trim() || `exit code ${extract.status}`}`,
      );
    }
  } finally {
    rmSync(tmpTarDir, { recursive: true, force: true });
  }
}
