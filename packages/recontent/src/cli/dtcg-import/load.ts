import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { isObject, sourceKey } from "./types.js";
import type { JsonObject, Warn } from "./types.js";

/** A non-default modifier context: its tokens override or extend the base. */
type ThemeContext = { modifier: string; context: string; doc: JsonObject };

export type LoadedSources = {
  base: JsonObject;
  contexts: ThemeContext[];
  /** Files the config was generated from, relative to the working directory. */
  files: string[];
};

function readJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as unknown;
  } catch (error) {
    throw new Error(`Could not read DTCG file "${file}": ${(error as Error).message}`, {
      cause: error,
    });
  }
}

function isResolver(file: string, json: unknown): boolean {
  if (file.endsWith(".resolver.json")) return true;
  return isObject(json) && typeof json.$schema === "string" && json.$schema.includes("resolver");
}

/**
 * Copies `doc` with every group `$type` pushed down onto the tokens that
 * inherit it, so documents can be merged without mixing up their types.
 */
function pushDownTypes(node: JsonObject, inherited?: string): JsonObject {
  const type = typeof node.$type === "string" ? node.$type : inherited;
  const result: JsonObject = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === "$type" && !("$value" in node)) continue;
    if (key === "$extensions") continue;
    if (key.startsWith("$") && key !== "$root") {
      result[key] = structuredClone(value);
    } else if (isObject(value)) {
      result[key] = pushDownTypes(value, type);
    }
  }
  if ("$value" in node && type !== undefined) result.$type = type;
  return result;
}

function isToken(node: unknown): node is JsonObject {
  return isObject(node) && "$value" in node;
}

/** Deep-merges `source` into `target`; whole tokens are replaced, later wins. */
function mergeInto(
  target: JsonObject,
  source: JsonObject,
  path: string[] = [],
  onConflict?: (path: string[]) => void,
): void {
  for (const [key, value] of Object.entries(source)) {
    if (path.length === 0 && key === "$schema") continue;
    const existing = target[key];
    if (isObject(value) && isObject(existing) && !isToken(value) && !isToken(existing)) {
      mergeInto(existing, value, [...path, key], onConflict);
      continue;
    }
    if (isToken(existing) && JSON.stringify(existing) !== JSON.stringify(value)) {
      onConflict?.([...path, key]);
    }
    target[key] = structuredClone(value);
  }
}

function readDocument(file: string): JsonObject {
  const json = readJson(file);
  if (!isObject(json)) {
    throw new Error(`DTCG file "${file}" must contain a JSON object.`);
  }
  return pushDownTypes(json);
}

function listTokenFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listTokenFiles(full));
    else if (entry.name.endsWith(".tokens.json")) files.push(full);
  }
  return files.sort();
}

type Entry = { kind: "set" | "modifier"; name: string; definition: JsonObject };

function loadResolver(file: string, warn: Warn): { base: JsonObject; contexts: ThemeContext[] } {
  const resolver = readJson(file);
  if (!isObject(resolver) || !Array.isArray(resolver.resolutionOrder)) {
    throw new Error(`Resolver "${file}" must contain a resolutionOrder array.`);
  }
  const baseDir = path.dirname(file);
  const sets = isObject(resolver.sets) ? resolver.sets : {};
  const modifiers = isObject(resolver.modifiers) ? resolver.modifiers : {};

  function lookup(reference: string): Entry | undefined {
    const match = /^#\/(sets|modifiers)\/([^/]+)$/.exec(reference);
    const definition = match && (match[1] === "sets" ? sets : modifiers)[match[2]!];
    if (!match || !isObject(definition)) return undefined;
    return { kind: match[1] === "sets" ? "set" : "modifier", name: match[2]!, definition };
  }

  function loadSource(source: unknown, seen: string[]): JsonObject[] {
    if (!isObject(source)) return [];
    if (typeof source.$ref !== "string") return [pushDownTypes(source)];
    const reference = source.$ref;
    if (reference.startsWith("#/")) {
      const entry = lookup(reference);
      if (!entry || entry.kind !== "set" || seen.includes(reference)) {
        warn(`Unsupported or unresolvable source reference "${reference}"; skipping it.`);
        return [];
      }
      usedSets.add(entry.name);
      return loadSources(entry.definition.sources, [...seen, reference]);
    }
    if (reference.includes("#")) {
      warn(`JSON pointers into files are not supported ("${reference}"); skipping it.`);
      return [];
    }
    return [readDocument(path.resolve(baseDir, reference))];
  }

  function loadSources(sources: unknown, seen: string[] = []): JsonObject[] {
    return Array.isArray(sources) ? sources.flatMap((source) => loadSource(source, seen)) : [];
  }

  function mergeAll(docs: JsonObject[]): JsonObject {
    const merged: JsonObject = {};
    for (const doc of docs) mergeInto(merged, doc);
    return merged;
  }

  const base: JsonObject = {};
  const contexts: ThemeContext[] = [];
  const usedSets = new Set<string>();

  (resolver.resolutionOrder as unknown[]).forEach((item, index) => {
    let entry: Entry | undefined;
    if (isObject(item) && typeof item.$ref === "string") {
      entry = lookup(item.$ref);
      if (!entry) {
        warn(`Unsupported or unresolvable resolutionOrder entry "${item.$ref}"; skipping it.`);
        return;
      }
    } else if (isObject(item)) {
      const name = typeof item.name === "string" ? item.name : `entry-${index}`;
      entry = { kind: "contexts" in item ? "modifier" : "set", name, definition: item };
    } else {
      return;
    }

    if (entry.kind === "set") {
      usedSets.add(entry.name);
      mergeInto(base, mergeAll(loadSources(entry.definition.sources)));
      return;
    }

    const modifierContexts = isObject(entry.definition.contexts) ? entry.definition.contexts : {};
    const names = Object.keys(modifierContexts);
    if (names.length === 0) return;
    let defaultName = entry.definition.default;
    if (typeof defaultName !== "string" || !names.includes(defaultName)) {
      defaultName = names.includes("default") ? "default" : names[0]!;
      if (!names.includes("default")) {
        warn(
          `Modifier "${entry.name}" has no default context; using its first context "${defaultName}".`,
        );
      }
    }
    for (const name of names) {
      const doc = mergeAll(loadSources(modifierContexts[name]));
      if (name === defaultName) mergeInto(base, doc);
      else contexts.push({ modifier: entry.name, context: name, doc });
    }
  });

  for (const name of Object.keys(sets)) {
    if (!usedSets.has(name)) {
      warn(`Set "${name}" is not part of resolutionOrder; ignoring it.`);
    }
  }

  return { base, contexts };
}

/**
 * Reads DTCG sources: a single resolver file, or token files / directories
 * that are merged in the order given.
 */
export function loadSources(sources: string[], cwd: string, warn: Warn): LoadedSources {
  const resolved = sources.map((source) => path.resolve(cwd, source));
  const display = (file: string) => path.relative(cwd, file).split(path.sep).join("/");

  const files: string[] = [];
  for (const source of resolved) {
    let stats;
    try {
      stats = statSync(source);
    } catch {
      throw new Error(`DTCG source "${source}" does not exist.`);
    }
    files.push(...(stats.isDirectory() ? listTokenFiles(source) : [source]));
  }
  if (files.length === 0) {
    throw new Error("No *.tokens.json files found in the given DTCG sources.");
  }

  const resolvers = files.filter((file) => isResolver(file, readJson(file)));
  if (resolvers.length > 0) {
    if (files.length > 1) {
      throw new Error("A resolver file must be the only --from source.");
    }
    return { ...loadResolver(resolvers[0]!, warn), files: [display(resolvers[0]!)] };
  }

  const base: JsonObject = {};
  for (const file of files) {
    mergeInto(base, readDocument(file), [], (conflict) => {
      warn(
        `Token "${sourceKey(conflict)}" is defined with different values; "${display(file)}" wins.`,
      );
    });
  }
  return { base, contexts: [], files: files.map(display) };
}
