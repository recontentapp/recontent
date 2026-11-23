import { isObject, sourceKey } from "./types.js";
import type { FlatToken, TokenMap, Warn } from "./types.js";
import { aliasTarget, lookupToken } from "./types.js";

const INVALID_NAME_CHARS = /[.{}]/g;
const RESERVED_NAMES = new Set(["__proto__", "constructor", "prototype"]);

/** Makes `name` acceptable to recontent (see `validateTokenName` in define.ts) and unique among `used`. */
function sanitizeName(name: string, used: Set<string>, location: string, warn: Warn): string {
  let result = name.replace(INVALID_NAME_CHARS, "_");
  if (result.startsWith("$")) result = `_${result.slice(1)}`;
  if (result === "") result = "_";
  if (RESERVED_NAMES.has(result)) result = `${result}_`;
  while (used.has(result)) result = `${result}_`;
  if (result !== name) {
    warn(`Renamed "${location}" to "${result}": recontent does not accept that token name.`);
  }
  used.add(result);
  return result;
}

function rootName(used: Set<string>): string {
  let name = "root";
  while (used.has(name)) name = `_${name}`;
  used.add(name);
  return name;
}

function metadata(node: Record<string, unknown>): Pick<FlatToken, "description" | "deprecated"> {
  const result: Pick<FlatToken, "description" | "deprecated"> = {};
  if (typeof node.$description === "string") result.description = node.$description;
  if (node.$deprecated === true || typeof node.$deprecated === "string") {
    result.deprecated = node.$deprecated;
  }
  return result;
}

/**
 * Turns a DTCG document into a flat map keyed by the dotted source path.
 * `$type` is inherited from groups, `$root` becomes a regular child and
 * `$extensions` is dropped.
 */
export function flattenDocument(document: unknown, warn: Warn): TokenMap {
  const tokens: TokenMap = new Map();

  function walkGroup(
    group: Record<string, unknown>,
    sourcePath: string[],
    path: string[],
    inheritedType: string | undefined,
  ): void {
    const type = typeof group.$type === "string" ? group.$type : inheritedType;
    if ("$extends" in group) {
      warn(`Group "${sourceKey(sourcePath)}" uses $extends, which is not supported; ignoring it.`);
    }

    const used = new Set<string>();
    const children = Object.keys(group).filter((key) => !key.startsWith("$"));
    // Reserve the real child names first so a `$root` token can never steal one.
    const names = new Map<string, string>();
    for (const key of children) {
      names.set(key, sanitizeName(key, used, sourceKey([...sourcePath, key]), warn));
    }

    const entries: Array<[string, string]> = children.map((key) => [key, names.get(key)!]);
    if ("$root" in group) entries.push(["$root", rootName(used)]);

    for (const [key, name] of entries) {
      const child = group[key];
      if (!isObject(child)) continue;
      const childSource = [...sourcePath, key];
      const childPath = [...path, name];
      if ("$value" in child) {
        const childType = typeof child.$type === "string" ? child.$type : type;
        tokens.set(sourceKey(childSource), {
          sourcePath: childSource,
          path: childPath,
          type: childType,
          value: child.$value,
          ...metadata(child),
        });
      } else {
        walkGroup(child, childSource, childPath, type);
      }
    }
  }

  if (isObject(document)) walkGroup(document, [], [], undefined);
  return tokens;
}

function inferFromValue(value: unknown): string | undefined {
  if (typeof value === "number") return "number";
  if (typeof value === "string") {
    return /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) ? "color" : undefined;
  }
  if (Array.isArray(value)) {
    return value.length === 4 && value.every((item) => typeof item === "number")
      ? "cubicBezier"
      : undefined;
  }
  if (!isObject(value)) return undefined;
  if ("colorSpace" in value) return "color";
  if (typeof value.value === "number" && typeof value.unit === "string") {
    if (["px", "rem", "em"].includes(value.unit)) return "dimension";
    if (["ms", "s"].includes(value.unit)) return "duration";
  }
  return undefined;
}

/**
 * Fills in `type` for tokens that have none: from the value's shape, or, for
 * an alias, from the token it points to.
 */
export function inferMissingTypes(tokens: TokenMap, warn: Warn): void {
  function typeOf(token: FlatToken, seen: Set<FlatToken>): string | undefined {
    if (token.type !== undefined) return token.type;
    if (seen.has(token)) return undefined;
    seen.add(token);
    const target = aliasTarget(token.value);
    if (target === undefined) return inferFromValue(token.value);
    const targetToken = lookupToken(tokens, target);
    return targetToken ? typeOf(targetToken, seen) : undefined;
  }

  const inferredPaths: string[] = [];
  for (const token of tokens.values()) {
    if (token.type !== undefined) continue;
    const inferred = typeOf(token, new Set());
    if (inferred === undefined) continue;
    token.type = inferred;
    inferredPaths.push(sourceKey(token.sourcePath));
  }
  if (inferredPaths.length > 0) {
    warn(
      `Inferred a missing $type from the value for ${inferredPaths.length} token(s), e.g. "${inferredPaths[0]}".`,
    );
  }
}
