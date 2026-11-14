import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snippetsDir = path.join(docsRoot, "src/snippets");
const recontentBin = path.join(
  path.dirname(createRequire(import.meta.url).resolve("recontent")),
  "cli/bin.mjs",
);

// Every snippet included in a page is a complete recontent.config.ts. Building each one keeps the
// examples working as the CLI and the plugins change. Snippets that set `introspection` expect the
// components entry of the project they describe.
const componentsEntry = `import type { ReactNode } from "react";

export function Button(props: { label: string }): ReactNode {
  return props.label;
}
`;
for (const file of fs.readdirSync(snippetsDir).filter((name) => name.endsWith(".config.ts"))) {
  test(`snippet ${file} builds without warnings`, () => {
    // Inside the docs app so that `recontent` resolves from the config's directory.
    const workDir = fs.mkdtempSync(path.join(docsRoot, ".snippet-"));
    try {
      fs.copyFileSync(path.join(snippetsDir, file), path.join(workDir, file));
      fs.mkdirSync(path.join(workDir, "src/components"), { recursive: true });
      fs.writeFileSync(path.join(workDir, "src/components/index.ts"), componentsEntry);
      fs.writeFileSync(
        path.join(workDir, "tsconfig.json"),
        JSON.stringify({ extends: "../tsconfig.json", include: ["src"] }),
      );
      const result = spawnSync(
        process.execPath,
        [recontentBin, "build", "-c", file, "--cwd", workDir],
        { encoding: "utf8" },
      );

      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stderr, /Wrote \d+ files?/);
      assert.doesNotMatch(result.stderr, /warning:/);
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  });
}
