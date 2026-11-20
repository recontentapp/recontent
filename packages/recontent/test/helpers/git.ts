import { spawnSync } from "node:child_process";

/** Runs `git <args>` in `dir`, throwing with git's own message when it fails. */
export function git(dir: string, ...args: string[]): void {
  const result = spawnSync("git", args, { cwd: dir, encoding: "utf-8" });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
}

/** Stages everything and commits it, with an identity so no git config is needed. */
export function commitAll(dir: string, message = "initial"): void {
  git(dir, "add", "-A");
  git(
    dir,
    "-c",
    "user.email=test@example.com",
    "-c",
    "user.name=Test",
    "commit",
    "-q",
    "-m",
    message,
  );
}
