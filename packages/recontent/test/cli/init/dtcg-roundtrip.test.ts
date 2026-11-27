import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@jest/globals";
import { flattenDocument } from "../../../src/cli/commands/init/dtcg-import/flatten.js";
import { loadSources } from "../../../src/cli/commands/init/dtcg-import/load.js";
import {
  aliasTarget,
  isObject,
  lookupToken,
} from "../../../src/cli/commands/init/dtcg-import/types.js";
import type { TokenMap } from "../../../src/cli/commands/init/dtcg-import/types.js";
import { FONT_WEIGHT_NUMERIC } from "../../../src/token-model/values.js";
import { copyFixture, makeScratchDir, runCli, useCliScratch } from "../../helpers/cli.js";

useCliScratch();

const resolver = "fixture.resolver.json";

type Tokens = Record<string, unknown>;

function normalize(value: unknown, key?: string): unknown {
  if (key === "fontFamily") {
    const families = Array.isArray(value) ? value : String(value).split(",");
    return families.map((family) =>
      String(family)
        .trim()
        .replace(/^['"]|['"]$/g, ""),
    );
  }
  if (key === "fontWeight" && typeof value === "string") {
    return FONT_WEIGHT_NUMERIC[value as keyof typeof FONT_WEIGHT_NUMERIC] ?? value;
  }
  if (key === "letterSpacing" && value === 0) return { value: 0, unit: "px" };
  if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)) {
    const [r, g, b] = [1, 3, 5].map((index) => parseInt(value.slice(index, index + 2), 16) / 255);
    return { colorSpace: "srgb", components: [r, g, b], alpha: 1 };
  }
  if (typeof value === "string") {
    const match = /^(-?\d*\.?\d+)(px|rem|em|ms|s)$/.exec(value);
    // The dtcg plugin emits em as rem, the only relative unit DTCG defines.
    return match ? { value: Number(match[1]), unit: match[2] === "em" ? "rem" : match[2] } : value;
  }
  if (Array.isArray(value)) return value.map((item) => normalize(item));
  if (!isObject(value)) return value;
  if (typeof value.value === "number" && value.unit === "em") return { ...value, unit: "rem" };
  if ("colorSpace" in value) {
    return {
      colorSpace: value.colorSpace,
      components: value.components,
      alpha: value.alpha ?? 1,
    };
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([name]) => name !== "WebkitFontSmoothing" && (name !== "inset" || value[name] === true),
      )
      .map(([name, item]) => [name, normalize(item, name)]),
  );
}

function resolveSource(tokens: TokenMap, value: unknown): unknown {
  const reference = aliasTarget(value);
  if (reference !== undefined) return resolveSource(tokens, lookupToken(tokens, reference)!.value);
  if (Array.isArray(value)) return value.map((item) => resolveSource(tokens, item));
  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([name, item]) => [name, resolveSource(tokens, item)]),
    );
  }
  return value;
}

function outputNode(doc: Tokens, layerPath: string[]): { $value?: unknown } | undefined {
  let node: unknown = doc;
  for (const segment of layerPath) node = isObject(node) ? node[segment] : undefined;
  return isObject(node) && "$value" in node ? node : undefined;
}

function resolveOutput(doc: Tokens, value: unknown): unknown {
  const reference = aliasTarget(value);
  if (reference !== undefined) {
    return resolveOutput(doc, outputNode(doc, reference.split("."))!.$value);
  }
  if (Array.isArray(value)) return value.map((item) => resolveOutput(doc, item));
  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([name, item]) => [name, resolveOutput(doc, item)]),
    );
  }
  return value;
}

/** Compares every source token present in `doc` with its resolved output value. */
function compare(source: TokenMap, doc: Tokens): number {
  let compared = 0;
  for (const token of source.values()) {
    const node =
      outputNode(doc, ["ref", ...token.path]) ?? outputNode(doc, ["system", ...token.path]);
    if (!node) continue;
    const key = token.type === "fontFamily" || token.type === "fontWeight" ? token.type : undefined;
    expect({
      path: token.path,
      value: normalize(resolveOutput(doc, node.$value), key),
    }).toEqual({
      path: token.path,
      value: normalize(resolveSource(source, token.value), key),
    });
    compared += 1;
  }
  return compared;
}

function mergeDocs(...docs: Tokens[]): Tokens {
  const result: Tokens = {};
  for (const doc of docs) {
    for (const [key, value] of Object.entries(doc)) {
      if (key === "$schema") continue;
      const existing = result[key];
      if (
        isObject(value) &&
        isObject(existing) &&
        !("$value" in value) &&
        !("$value" in existing)
      ) {
        result[key] = mergeDocs(existing, value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

test("keeps the resolved values of every supported token, in every theme", () => {
  const dir = makeScratchDir("init-from-roundtrip");
  copyFixture("dtcg", dir);
  expect(runCli(["--cwd", dir, "init", "--dtcg", resolver]).status).toBe(0);
  const generated = path.join(dir, "recontent.config.ts");
  const withPlugin = readFileSync(generated, "utf-8")
    .replace(/^import \{/m, 'import { dtcg } from "recontent/plugins";\nimport {')
    .replace(/\n\}\);\n$/, '\n  plugins: [dtcg({ outDir: "out" })],\n});\n');
  writeFileSync(path.join(dir, "build.config.ts"), withPlugin);
  expect(runCli(["--cwd", dir, "build", "-c", "build.config.ts"]).status).toBe(0);

  const loaded = loadSources([resolver], dir, () => {});
  const outLoaded = loadSources(["out/tokens.resolver.json"], dir, () => {});

  expect(
    outLoaded.modifiers.map((mod) => ({
      name: mod.name,
      default: mod.default,
      contexts: mod.contexts.map((c) => c.name),
    })),
  ).toEqual(
    loaded.modifiers.map((mod) => ({
      name: mod.name,
      default: mod.default,
      contexts: mod.contexts.map((c) => c.name),
    })),
  );

  const base = flattenDocument(loaded.base, () => {});
  expect(compare(base, outLoaded.base)).toBe(30);

  for (let i = 0; i < loaded.modifiers.length; i++) {
    const mod = loaded.modifiers[i]!;
    const outMod = outLoaded.modifiers[i]!;
    for (let j = 0; j < mod.contexts.length; j++) {
      const context = mod.contexts[j]!;
      const outContext = outMod.contexts[j]!;
      const effective: TokenMap = new Map(base);
      for (const [key, token] of flattenDocument(context.doc, () => {})) {
        effective.set(key, { ...token, type: token.type ?? base.get(key)?.type });
      }
      // theme.extra only exists in dark and is reported as skipped.
      expect(compare(effective, mergeDocs(outLoaded.base, outContext.doc))).toBe(30);
    }
  }

  // Combined multi-modifier resolution in resolutionOrder (theme=dark + density=compact).
  const combinedSource: TokenMap = new Map(base);
  const combinedOutDocs: Tokens[] = [outLoaded.base];
  for (let i = 0; i < loaded.modifiers.length; i++) {
    const context = loaded.modifiers[i]!.contexts[0]!;
    const outContext = outLoaded.modifiers[i]!.contexts[0]!;
    for (const [key, token] of flattenDocument(context.doc, () => {})) {
      combinedSource.set(key, { ...token, type: token.type ?? base.get(key)?.type });
    }
    combinedOutDocs.push(outContext.doc);
  }
  expect(compare(combinedSource, mergeDocs(...combinedOutDocs))).toBe(30);
});
