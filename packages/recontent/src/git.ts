import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
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

/** HEAD's sha, or `undefined` outside a work tree or before the first commit. */
export function readHead(cwd: string): string | undefined {
  const head = run(["rev-parse", "HEAD"], cwd);
  return head.status === 0 ? head.stdout.trim() : undefined;
}

/**
 * ISO 8601 date of the last commit touching each of `files` (absolute paths).
 * Files outside the work tree, uncommitted ones and — in a shallow clone, where
 * every file would read as touched by the grafted commit — all of them are
 * absent, with the reason in `warning`.
 *
 * Only tracked files are looked up (one cheap `git ls-files`), then one
 * `git log`, newest commit first, killed as soon as every file has been seen,
 * so the cost follows the age of the oldest last change, not the size of the
 * history. Pathspecs are literal: a `*` or a leading `:` in a file name
 * matches nothing else.
 */
export async function readLastUpdated(
  root: string,
  files: string[],
): Promise<{ dates: Map<string, string>; warning?: string }> {
  const dates = new Map<string, string>();
  const top = run(["rev-parse", "--show-toplevel"], root);
  if (top.status !== 0) {
    return {
      dates,
      warning: "history: not a git repository (or git is missing), lastUpdatedAt omitted.",
    };
  }
  if (run(["rev-parse", "--is-shallow-repository"], root).stdout.trim() === "true") {
    return {
      dates,
      warning: "history: shallow clone, lastUpdatedAt omitted; fetch more depth.",
    };
  }

  const gitRoot = realpathSync(top.stdout.trim());
  const pending = new Map<string, string>();
  for (const file of files) {
    const relative = path.relative(gitRoot, realpathSync(file));
    if (relative.startsWith("..") || path.isAbsolute(relative)) continue;
    pending.set(relative.split(path.sep).join("/"), file);
  }
  if (pending.size === 0) return { dates };

  // An untracked file never shows up in the log, which would then be read to the root commit.
  const tracked = spawnSync(
    "git",
    ["--literal-pathspecs", "ls-files", "-z", "--", ...pending.keys()],
    { cwd: gitRoot, encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 },
  );
  if (tracked.status !== 0) return { dates };
  const trackedNames = new Set(tracked.stdout.split("\0").filter(Boolean));
  for (const name of pending.keys()) if (!trackedNames.has(name)) pending.delete(name);
  if (pending.size === 0) return { dates };

  const git = spawn(
    "git",
    [
      "--literal-pathspecs",
      "-c",
      "core.quotePath=false",
      "log",
      "--format=%x00%cI",
      "--name-only",
      "--",
      ...pending.keys(),
    ],
    { cwd: gitRoot, stdio: ["ignore", "pipe", "ignore"] },
  );
  let buffer = "";
  const consume = (record: string) => {
    const [date = "", ...names] = record.split("\n");
    for (const name of names) {
      const file = pending.get(name);
      if (file === undefined) continue;
      dates.set(file, date);
      pending.delete(name);
    }
  };

  await new Promise<void>((resolve) => {
    git.on("error", () => resolve());
    git.on("close", () => resolve());
    git.stdout.setEncoding("utf-8");
    git.stdout.on("data", (chunk: string) => {
      buffer += chunk;
      // A record runs up to the next NUL, so the last piece may still be growing.
      const records = buffer.split("\0");
      buffer = records.pop() ?? "";
      for (const record of records) if (record) consume(record);
      if (pending.size === 0) git.kill();
    });
  });
  if (buffer && pending.size > 0) consume(buffer);
  return { dates };
}
