import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
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
    const first = await writeOutputFile(filePath, "first", dir);
    expect(first.written).toBe(true);
    expect(await readFile(filePath, "utf8")).toBe("first");

    const second = await writeOutputFile(filePath, "second", dir);
    expect(second.written).toBe(true);
    expect(await readFile(filePath, "utf8")).toBe("second");
  });

  test('writeMode "once" creates the file when absent', async () => {
    const filePath = path.join(dir, "once.txt");
    const result = await writeOutputFile(filePath, "initial", dir, { writeMode: "once" });
    expect(result.written).toBe(true);
    expect(await readFile(filePath, "utf8")).toBe("initial");
  });

  test('writeMode "once" leaves modified contents intact on a second call', async () => {
    const filePath = path.join(dir, "once.txt");
    await writeOutputFile(filePath, "initial", dir, { writeMode: "once" });
    await writeFile(filePath, "user-edited", "utf8");

    const result = await writeOutputFile(filePath, "regenerated", dir, { writeMode: "once" });
    expect(result.written).toBe(false);
    expect(await readFile(filePath, "utf8")).toBe("user-edited");
  });

  test("a file that already holds the content is not rewritten", async () => {
    const filePath = path.join(dir, "same.txt");
    await writeOutputFile(filePath, "content", dir);
    const before = (await stat(filePath)).mtimeMs;
    await new Promise((resolve) => setTimeout(resolve, 20));

    const result = await writeOutputFile(filePath, "content", dir);
    expect(result).toMatchObject({ written: false, skipReason: "unchanged" });
    expect((await stat(filePath)).mtimeMs).toBe(before);

    const changed = await writeOutputFile(filePath, "other", dir);
    expect(changed.written).toBe(true);
    expect(await readFile(filePath, "utf8")).toBe("other");
  });

  test("a path that resolves outside the base directory is rejected", async () => {
    await expect(writeOutputFile("../escape.txt", "x", dir)).rejects.toThrow(/outside of/);
    await expect(writeOutputFile(path.join(tmpdir(), "escape.txt"), "x", dir)).rejects.toThrow(
      /outside of/,
    );
    await expect(writeOutputFile("nested/../ok.txt", "x", dir)).resolves.toMatchObject({
      written: true,
    });
  });

  test("a relative path resolves against the passed base directory, not process.cwd()", async () => {
    const outsideCwd = await mkdtemp(path.join(tmpdir(), "recontent-fs-elsewhere-"));
    try {
      const result = await writeOutputFile("nested/output.txt", "content", dir);
      expect(result.path).toBe(path.join(dir, "nested", "output.txt"));
      expect(await readFile(result.path, "utf8")).toBe("content");

      // Sanity check: nothing was written relative to process.cwd() or to an
      // unrelated directory, even though both existed at call time.
      expect(result.path.startsWith(outsideCwd)).toBe(false);
      expect(result.path.startsWith(process.cwd())).toBe(false);
    } finally {
      await rm(outsideCwd, { recursive: true, force: true });
    }
  });
});
