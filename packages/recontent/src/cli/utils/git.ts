import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
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

export function assertHasCommits(gitRoot: string): void {
  if (run(["rev-parse", "--verify", "--quiet", "HEAD"], gitRoot).status !== 0) {
    throw new Error(`No commits yet in the git repository at "${gitRoot}".`);
  }
}

export function assertRevision(gitRoot: string, rev: string): void {
  if (rev.startsWith("-")) {
    throw new Error(`Not a valid git revision: "${rev}".`);
  }
  const result = run(["rev-parse", "--verify", "--end-of-options", `${rev}^{commit}`], gitRoot);
  if (result.status !== 0) {
    throw new Error(`Not a valid git revision: "${rev}".`);
  }
}

/**
 * `diff` loads and executes `<rev>`'s recontent.config.ts, so only revisions
 * already in this branch's history may be diffed — an unmerged branch or any
 * third-party-writable ref could otherwise run arbitrary code at the CLI's
 * privilege level. Distinguishes a genuine refusal from the shallow-clone
 * case (`actions/checkout` defaults to depth 1), where `merge-base` fails for
 * lack of history rather than because `rev` isn't an ancestor.
 */
export function assertAncestorOfHead(gitRoot: string, rev: string): void {
  const result = run(["merge-base", "--is-ancestor", "--end-of-options", rev, "HEAD"], gitRoot);
  if (result.status === 0) {
    return;
  }
  if (result.status === 1) {
    throw new Error(
      `Refusing to diff against "${rev}": it is not an ancestor of HEAD. Diffing a revision ` +
        "loads and executes its recontent.config.ts, so only revisions already in this branch's " +
        "history are allowed.",
    );
  }
  if (
    /missing (blob|tree|commit) object|bad object|no such ref|unknown revision/i.test(result.stderr)
  ) {
    throw new Error(
      `Could not determine whether "${rev}" is an ancestor of HEAD: this looks like a shallow ` +
        "clone missing the required history. Fetch more depth (e.g. `git fetch --unshallow` or a " +
        "deeper `fetch-depth` in CI) and try again.",
    );
  }
  throw new Error(
    `Could not determine whether "${rev}" is an ancestor of HEAD: ${result.stderr.trim() || `exit code ${result.status}`}`,
  );
}

/**
 * Reproduces the whole tree at `rev` into `destDir` via `git archive | tar -x`.
 * Preferred over `git worktree` — no lock files, no cleanup hazard, and it
 * works on the shallow clones `actions/checkout` produces by default, as
 * long as the rev itself is present.
 */
export function archiveRevision(gitRoot: string, rev: string, destDir: string): void {
  const tmpTarDir = mkdtempSync(path.join(os.tmpdir(), "recontent-archive-"));
  const tarPath = path.join(tmpTarDir, "archive.tar");
  try {
    const archive = spawnSync("git", ["archive", `--output=${tarPath}`, "--end-of-options", rev], {
      cwd: gitRoot,
    });
    if (archive.status !== 0) {
      const stderr = archive.stderr ? archive.stderr.toString("utf-8") : "";
      throw new Error(
        `"git archive ${rev}" failed: ${stderr.trim() || `exit code ${archive.status}`}`,
      );
    }

    // `--no-same-owner`: extracting as the current user regardless of the uid/gid recorded in the
    // tar, since this runs as whatever user invoked the CLI, not root restoring a backup. No `-p`
    // (preserve permissions) either — the default already drops setuid/setgid bits on extraction.
    const extract = spawnSync("tar", ["--no-same-owner", "-x", "-f", tarPath, "-C", destDir]);
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
