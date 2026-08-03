import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { writeOutputFile } from "../src/cli/utils/fs.js";

describe("writeOutputFile", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "recontent-fs-test-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test("without writeMode, always writes and reports written: true", async () => {
    const filePath = path.join(dir, "always.txt");
    const first = await writeOutputFile(filePath, "first");
    expect(first.written).toBe(true);
    expect(await readFile(filePath, "utf8")).toBe("first");

    const second = await writeOutputFile(filePath, "second");
    expect(second.written).toBe(true);
    expect(await readFile(filePath, "utf8")).toBe("second");
  });

  test('writeMode "once" creates the file when absent', async () => {
    const filePath = path.join(dir, "once.txt");
    const result = await writeOutputFile(filePath, "initial", { writeMode: "once" });
    expect(result.written).toBe(true);
    expect(await readFile(filePath, "utf8")).toBe("initial");
  });

  test('writeMode "once" leaves modified contents intact on a second call', async () => {
    const filePath = path.join(dir, "once.txt");
    await writeOutputFile(filePath, "initial", { writeMode: "once" });
    await writeFile(filePath, "user-edited", "utf8");

    const result = await writeOutputFile(filePath, "regenerated", { writeMode: "once" });
    expect(result.written).toBe(false);
    expect(await readFile(filePath, "utf8")).toBe("user-edited");
  });
});
