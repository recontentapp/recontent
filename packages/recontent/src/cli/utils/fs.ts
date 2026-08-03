import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export async function writeOutputFile(
  filePath: string,
  content: string,
  options?: { writeMode?: "always" | "once" },
): Promise<{ path: string; written: boolean }> {
  const resolved = path.resolve(process.cwd(), filePath);

  if (options?.writeMode === "once" && existsSync(resolved)) {
    return { path: resolved, written: false };
  }

  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, content, "utf8");
  return { path: resolved, written: true };
}

export function exitWithError(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
  throw new Error(message);
}

export function logSuccess(message: string): void {
  console.log(message);
}
