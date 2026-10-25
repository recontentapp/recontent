import { spawnSync } from "node:child_process";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { FileHistory, GitInfo } from "@recontentapp/core";

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

const WEB_HOSTS = new Set(["github.com", "gitlab.com", "bitbucket.org"]);

/**
 * Parses a remote URL (`git@host:o/r.git`, `ssh://git@host/o/r`, `https://host/o/r.git`).
 * `url` has any credentials stripped; `webUrl` is only set for known hosts.
 */
export function parseRemote(remote: string): { url: string; webUrl?: string } {
  const trimmed = remote.trim();
  const scp = /^[^@/\s]+@([^:/\s]+):(.+)$/.exec(trimmed);
  let host: string | undefined;
  let repoPath: string | undefined;
  let url = trimmed;

  if (scp) {
    host = scp[1];
    repoPath = scp[2];
  } else {
    try {
      const parsed = new URL(trimmed);
      host = parsed.hostname;
      repoPath = parsed.pathname;
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        parsed.username = "";
        parsed.password = "";
        url = parsed.toString();
      }
    } catch {
      return { url };
    }
  }

  repoPath = repoPath?.replace(/^\/+|\/+$/g, "").replace(/\.git$/, "");
  if (!host || !repoPath || !WEB_HOSTS.has(host.toLowerCase())) return { url };
  return { url, webUrl: `https://${host.toLowerCase()}/${repoPath}` };
}

/**
 * Repo-level facts about the work tree containing `root`, or `undefined` when
 * `root` isn't in one (or `git` isn't installed, or there are no commits yet).
 */
export function readGitInfo(root: string): GitInfo | undefined {
  const top = run(["rev-parse", "--show-toplevel"], root);
  if (top.status !== 0) return undefined;
  const gitRoot = top.stdout.trim();
  const head = run(["rev-parse", "HEAD"], root);
  if (head.status !== 0) return undefined;

  const branch = run(["branch", "--show-current"], root).stdout.trim();
  const dirty = run(["status", "--porcelain", "--", root], root).stdout.trim() !== "";
  const shallow = run(["rev-parse", "--is-shallow-repository"], root).stdout.trim() === "true";
  const origin = run(["remote", "get-url", "origin"], root);
  const relativeRoot = path.relative(realpathSync(gitRoot), realpathSync(root));

  return {
    commit: head.stdout.trim(),
    ...(branch ? { branch } : {}),
    dirty,
    shallow,
    root: relativeRoot.split(path.sep).join("/"),
    ...(origin.status === 0 && origin.stdout.trim() ? { remote: parseRemote(origin.stdout) } : {}),
  };
}

/**
 * First and last commit touching each of `files` (absolute paths), from a
 * single `git log`. Files without commits are absent from the result.
 */
export function readFileHistory(root: string, files: string[]): Map<string, FileHistory> {
  const history = new Map<string, FileHistory>();
  if (files.length === 0) return history;

  const top = run(["rev-parse", "--show-toplevel"], root);
  if (top.status !== 0) return history;
  const gitRoot = realpathSync(top.stdout.trim());
  const byRelative = new Map(
    files.map((file) => [
      path.relative(gitRoot, realpathSync(file)).split(path.sep).join("/"),
      file,
    ]),
  );

  // Newest commit first: the first sighting of a file is its last update, the last one its creation.
  const log = run(
    [
      "-c",
      "core.quotePath=false",
      "log",
      "--format=%x00%H%x09%cI",
      "--name-only",
      "--",
      ...byRelative.keys(),
    ],
    gitRoot,
  );
  if (log.status !== 0) return history;

  for (const record of log.stdout.split("\0").slice(1)) {
    const [header = "", ...names] = record.split("\n");
    const [commit = "", date = ""] = header.split("\t");
    const entry = { commit, date };
    for (const name of names) {
      const file = byRelative.get(name);
      if (!file) continue;
      const existing = history.get(file);
      history.set(file, { updated: existing?.updated ?? entry, created: entry });
    }
  }
  return history;
}

/**
 * Permalink to `filePath` (relative to the config root) at the current commit,
 * or `undefined` without a known web remote or for files outside the repository.
 */
export function sourceUrl(git: GitInfo, filePath: string, line?: number): string | undefined {
  const webUrl = git.remote?.webUrl;
  if (!webUrl) return undefined;
  const repoPath = path.posix.join(git.root, filePath);
  if (repoPath.startsWith("..") || repoPath.split("/").includes("node_modules")) return undefined;

  if (new URL(webUrl).hostname === "bitbucket.org") {
    return `${webUrl}/src/${git.commit}/${repoPath}${line ? `#lines-${line}` : ""}`;
  }
  return `${webUrl}/blob/${git.commit}/${repoPath}${line ? `#L${line}` : ""}`;
}
