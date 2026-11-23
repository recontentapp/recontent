import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { checkPages, collectMdxFiles } from "../scripts/style-check.mjs";

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("all docs MDX pages follow STYLE.md", () => {
  const files = collectMdxFiles();
  assert.ok(files.length > 0, "expected MDX pages under src/pages");

  const { results, errors, warnings } = checkPages(files);
  const report = results
    .flatMap(({ file, issues }) => {
      const rel = path.relative(docsRoot, file);
      return issues.map((issue) => `${rel}:${issue.line}: ${issue.level}: ${issue.message}`);
    })
    .join("\n");

  assert.equal(errors, 0, `Style errors found:\n${report}`);
  assert.equal(warnings, 0, `Style warnings found:\n${report}`);
});
