import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathKey } from "../token-model/guards.js";
import { type ComponentInfo, type TypeInfo } from "../introspection/model.js";
import { type ThemeOverride, type TokenRegistry } from "../token-model/registry.js";
import { buildToken, type DocToken } from "./doc-token.js";

/** Shared by the snapshot and every `recontent inspect --format json` output. */
export const SCHEMA_VERSION = "1";

/** What introspecting a project's components yields. */
export type Introspected = { components: ComponentInfo[]; types: TypeInfo[] };

/**
 * Everything `recontent inspect` knows, in a portable form: a design system
 * publishes it (see the `inspect()` plugin) so that its consumers can browse
 * tokens, components and types without its config. `components` and `types` are
 * absent when the design system has no `introspection`.
 */
export type Snapshot = {
  schemaVersion: string;
  kind: "snapshot";
  themes: string[];
  tokens: DocToken[];
} & Partial<Introspected>;

const numericCollator = new Intl.Collator("en", { numeric: true });
export const numericCompare = (a: string, b: string) => numericCollator.compare(a, b);

export function createSnapshot(
  config: { registry: TokenRegistry; themes: Record<string, ThemeOverride> },
  introspected?: Introspected,
): Snapshot {
  const themes = Object.keys(config.themes);
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: "snapshot",
    themes,
    tokens: [...config.registry.values()]
      .map((entry) => ({ key: pathKey(entry.path), entry }))
      .sort((a, b) => numericCompare(a.key, b.key))
      .map(({ entry }) => buildToken(config, entry, themes)),
    ...(introspected ? { components: introspected.components, types: introspected.types } : {}),
  };
}

/** A path rather than a package name: relative, absolute, tilde-home, or `.json`. */
function isFilePath(from: string): boolean {
  return (
    from.startsWith(".") ||
    from.startsWith("/") ||
    from === "~" ||
    from.startsWith("~/") ||
    path.isAbsolute(from) ||
    from.endsWith(".json")
  );
}

/** Walks up from `cwd` like Node does, without going through the package's `exports`, which may hide package.json. */
function findPackageDirectory(name: string, cwd: string): string | undefined {
  for (let directory = path.resolve(cwd); ; directory = path.dirname(directory)) {
    const candidate = path.join(directory, "node_modules", name);
    if (fs.existsSync(path.join(candidate, "package.json"))) return candidate;
    if (directory === path.dirname(directory)) return undefined;
  }
}

function readJson(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (error) {
    throw new Error(
      `Cannot read ${file}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

/**
 * Reads the snapshot of a design system: `from` is a package name (its
 * package.json `recontent` field points at the snapshot) or a path to a
 * snapshot file. `source` names where it came from, for display.
 */
export function readSnapshot(from: string, cwd: string): { snapshot: Snapshot; source: string } {
  let file: string;
  let source: string;
  if (isFilePath(from)) {
    const expanded =
      from === "~"
        ? os.homedir()
        : from.startsWith("~/")
          ? path.join(os.homedir(), from.slice(2))
          : from;
    file = path.resolve(cwd, expanded);
    source = from;
  } else {
    const directory = findPackageDirectory(from, cwd);
    if (!directory) {
      throw new Error(
        `--from: package "${from}" is not installed (looked in node_modules from ${cwd} upward).`,
      );
    }
    const manifest = readJson(path.join(directory, "package.json")) as {
      version?: string;
      recontent?: unknown;
    };
    if (typeof manifest.recontent !== "string" || manifest.recontent.trim() === "") {
      throw new Error(
        `--from: ${from} has no "recontent" field in its package.json. Ask its maintainers to add the \`inspect()\` plugin and publish the snapshot it writes.`,
      );
    }
    file = path.resolve(directory, manifest.recontent);
    source = manifest.version ? `${from}@${manifest.version}` : from;
  }

  const snapshot = readJson(file) as Partial<Snapshot> | null;
  if (
    snapshot?.kind !== "snapshot" ||
    !Array.isArray(snapshot.tokens) ||
    !Array.isArray(snapshot.themes)
  ) {
    throw new Error(`--from: ${file} is not a recontent snapshot.`);
  }
  if (snapshot.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(
      Number(snapshot.schemaVersion) > Number(SCHEMA_VERSION)
        ? `--from: ${source} has a snapshot (schema ${snapshot.schemaVersion}) newer than this recontent understands (schema ${SCHEMA_VERSION}). Upgrade recontent.`
        : `--from: ${source} has an unsupported snapshot schema ${snapshot.schemaVersion}.`,
    );
  }
  return { snapshot: snapshot as Snapshot, source };
}
