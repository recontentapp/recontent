import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function writeOutputFile(filePath: string, content: string): Promise<string> {
  const resolved = path.resolve(process.cwd(), filePath);
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, content, "utf8");
  return resolved;
}

export function exitWithError(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
  throw new Error(message);
}

export function logSuccess(message: string): void {
  console.log(message);
}
