import { spawnSync } from "node:child_process";

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

export function readFileAtRevision(gitRoot: string, rev: string, relPath: string): string {
  const result = run(["show", `${rev}:${relPath}`], gitRoot);
  if (result.status !== 0) {
    throw new Error(`"${relPath}" does not exist at revision "${rev}".`);
  }
  return result.stdout;
}
