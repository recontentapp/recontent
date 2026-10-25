import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import { parseRemote, readFileHistory, readGitInfo, sourceUrl } from "../src/git.js";

let repo: string;
let outside: string;

function git(args: string[], cwd = repo): string {
  const result = spawnSync("git", args, { cwd, encoding: "utf-8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout.trim();
}

function commit(file: string, content: string, date: string): string {
  mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
  writeFileSync(path.join(repo, file), content);
  git(["add", "-A"]);
  const env = { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date };
  const result = spawnSync("git", ["commit", "-q", "-m", `edit ${file}`], {
    cwd: repo,
    env,
    encoding: "utf-8",
  });
  if (result.status !== 0) throw new Error(result.stderr);
  return git(["rev-parse", "HEAD"]);
}

beforeAll(() => {
  repo = realpathSync(mkdtempSync(path.join(os.tmpdir(), "recontent-git-")));
  outside = realpathSync(mkdtempSync(path.join(os.tmpdir(), "recontent-nogit-")));
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.email", "test@example.com"]);
  git(["config", "user.name", "test"]);
  git(["remote", "add", "origin", "git@github.com:acme/ds.git"]);
});

afterAll(() => {
  rmSync(repo, { recursive: true, force: true });
  rmSync(outside, { recursive: true, force: true });
});

describe("parseRemote", () => {
  test.each([
    ["git@github.com:acme/ds.git", "https://github.com/acme/ds"],
    ["git@github.com:acme/ds", "https://github.com/acme/ds"],
    ["ssh://git@github.com/acme/ds.git", "https://github.com/acme/ds"],
    ["https://github.com/acme/ds.git", "https://github.com/acme/ds"],
    ["https://github.com/acme/ds", "https://github.com/acme/ds"],
    ["https://gitlab.com/acme/group/ds.git", "https://gitlab.com/acme/group/ds"],
    ["git@bitbucket.org:acme/ds.git", "https://bitbucket.org/acme/ds"],
  ])("%s", (remote, webUrl) => {
    expect(parseRemote(remote).webUrl).toBe(webUrl);
  });

  test("an unknown host has no web URL", () => {
    expect(parseRemote("git@git.internal.example:acme/ds.git")).toEqual({
      url: "git@git.internal.example:acme/ds.git",
    });
  });

  test("credentials never leak into the URL", () => {
    expect(parseRemote("https://user:secret@github.com/acme/ds.git")).toEqual({
      url: "https://github.com/acme/ds.git",
      webUrl: "https://github.com/acme/ds",
    });
  });
});

describe("readGitInfo", () => {
  test("is undefined outside a work tree", () => {
    expect(readGitInfo(outside)).toBeUndefined();
  });

  test("is undefined before the first commit", () => {
    expect(readGitInfo(repo)).toBeUndefined();
  });

  test("reports commit, branch, dirty and the web remote", () => {
    const first = commit("ds/button.tsx", "export const a = 1;\n", "2024-01-01T10:00:00Z");

    expect(readGitInfo(path.join(repo, "ds"))).toEqual({
      commit: first,
      branch: "main",
      dirty: false,
      shallow: false,
      root: "ds",
      remote: { url: "git@github.com:acme/ds.git", webUrl: "https://github.com/acme/ds" },
    });

    writeFileSync(path.join(repo, "ds/button.tsx"), "export const a = 2;\n");
    expect(readGitInfo(path.join(repo, "ds"))?.dirty).toBe(true);
    git(["checkout", "--", "."]);
  });

  test("a detached HEAD has no branch", () => {
    git(["checkout", "-q", "--detach"]);
    expect(readGitInfo(repo)?.branch).toBeUndefined();
    git(["checkout", "-q", "main"]);
  });
});

describe("readFileHistory", () => {
  test("reports the first and last commit touching each file", () => {
    const created = git(["rev-parse", "HEAD"]);
    const other = commit("ds/card.tsx", "export const b = 1;\n", "2024-02-01T10:00:00Z");
    const updated = commit("ds/button.tsx", "export const a = 3;\n", "2024-03-01T10:00:00Z");

    const files = [path.join(repo, "ds/button.tsx"), path.join(repo, "ds/card.tsx")];
    const history = readFileHistory(repo, files);

    expect(history.get(files[0]!)).toEqual({
      created: { commit: created, date: "2024-01-01T10:00:00Z" },
      updated: { commit: updated, date: "2024-03-01T10:00:00Z" },
    });
    expect(history.get(files[1]!)).toEqual({
      created: { commit: other, date: "2024-02-01T10:00:00Z" },
      updated: { commit: other, date: "2024-02-01T10:00:00Z" },
    });
  });

  test("untracked files have no history", () => {
    const untracked = path.join(repo, "ds/new.tsx");
    writeFileSync(untracked, "export const c = 1;\n");
    expect(readFileHistory(repo, [untracked]).size).toBe(0);
  });
});

describe("sourceUrl", () => {
  const info = {
    commit: "abc123",
    dirty: false,
    shallow: false,
    root: "packages/ui",
    remote: { url: "git@github.com:acme/ds.git", webUrl: "https://github.com/acme/ds" },
  };

  test("links a file at the commit, relative to the git root", () => {
    expect(sourceUrl(info, "src/button.tsx", 12)).toBe(
      "https://github.com/acme/ds/blob/abc123/packages/ui/src/button.tsx#L12",
    );
    expect(sourceUrl(info, "src/button.tsx")).toBe(
      "https://github.com/acme/ds/blob/abc123/packages/ui/src/button.tsx",
    );
  });

  test("Bitbucket uses its own path and anchor", () => {
    const bitbucket = { ...info, remote: { url: "", webUrl: "https://bitbucket.org/acme/ds" } };
    expect(sourceUrl(bitbucket, "src/button.tsx", 3)).toBe(
      "https://bitbucket.org/acme/ds/src/abc123/packages/ui/src/button.tsx#lines-3",
    );
  });

  test("has no link without a web remote, or for files outside the repository", () => {
    expect(sourceUrl({ ...info, remote: undefined }, "src/button.tsx")).toBeUndefined();
    expect(sourceUrl({ ...info, root: "" }, "../../outside.tsx")).toBeUndefined();
    expect(sourceUrl(info, "../../node_modules/lib/index.d.ts")).toBeUndefined();
  });
});
