import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import { readHead, readLastUpdated } from "../src/git.js";

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
});

afterAll(() => {
  rmSync(repo, { recursive: true, force: true });
  rmSync(outside, { recursive: true, force: true });
});

describe("readHead", () => {
  test("is undefined outside a work tree and before the first commit", () => {
    expect(readHead(outside)).toBeUndefined();
    expect(readHead(repo)).toBeUndefined();
  });

  test("is HEAD's sha", () => {
    const first = commit("ds/button.tsx", "export const a = 1;\n", "2024-01-01T10:00:00Z");
    expect(readHead(path.join(repo, "ds"))).toBe(first);
  });
});

describe("readLastUpdated", () => {
  const file = (name: string) => path.join(repo, name);

  test("reports the date of the last commit touching each file", async () => {
    commit("ds/card.tsx", "export const b = 1;\n", "2024-02-01T10:00:00Z");
    commit("ds/button.tsx", "export const a = 3;\n", "2024-03-01T10:00:00Z");

    const { dates, warning } = await readLastUpdated(repo, [
      file("ds/button.tsx"),
      file("ds/card.tsx"),
    ]);

    expect(warning).toBeUndefined();
    expect(dates.get(file("ds/button.tsx"))).toBe("2024-03-01T10:00:00Z");
    expect(dates.get(file("ds/card.tsx"))).toBe("2024-02-01T10:00:00Z");
  });

  test("untracked files are absent, and a path outside the work tree does not affect the others", async () => {
    const untracked = file("ds/new.tsx");
    writeFileSync(untracked, "export const c = 1;\n");
    const stray = path.join(outside, "stray.tsx");
    writeFileSync(stray, "export const d = 1;\n");

    const { dates, warning } = await readLastUpdated(repo, [untracked, stray, file("ds/card.tsx")]);

    expect(warning).toBeUndefined();
    expect([...dates.keys()]).toEqual([file("ds/card.tsx")]);
  });

  test("outside a work tree it warns once and reports nothing", async () => {
    const { dates, warning } = await readLastUpdated(outside, [path.join(outside, "stray.tsx")]);

    expect(dates.size).toBe(0);
    expect(warning).toMatch(/not a git repository/);
  });

  test("a shallow clone warns instead of reporting the grafted commit's date for everything", async () => {
    const clone = path.join(outside, "clone");
    git(["clone", "-q", "--depth", "1", `file://${repo}`, clone], outside);

    const { dates, warning } = await readLastUpdated(clone, [path.join(clone, "ds/button.tsx")]);

    expect(dates.size).toBe(0);
    expect(warning).toMatch(/shallow clone/);
  });
});
