type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type JsonObject = { [key: string]: Json };

export type Warn = (message: string) => void;

export function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A token read out of a DTCG document, before conversion. */
export type FlatToken = {
  /** Original DTCG path, `$root` kept as-is. Aliases address tokens by this. */
  sourcePath: string[];
  /** Path the token gets in the generated config (sanitized, `$root` renamed). */
  path: string[];
  type: string | undefined;
  value: unknown;
  description?: string;
  deprecated?: boolean | string;
};

export type TokenMap = Map<string, FlatToken>;

const ALIAS_RE = /^\{([^{}]+)\}$/;

export function sourceKey(path: readonly string[]): string {
  return path.join(".");
}

export function aliasTarget(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return ALIAS_RE.exec(value)?.[1];
}

/** Whether an alias appears anywhere inside `value`, at the top or in a composite member. */
export function containsAlias(value: unknown): boolean {
  if (typeof value === "string") return ALIAS_RE.test(value);
  if (Array.isArray(value)) return value.some(containsAlias);
  if (isObject(value)) return Object.values(value).some(containsAlias);
  return false;
}

export function containsJsonPointer(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsJsonPointer);
  if (isObject(value)) return "$ref" in value || Object.values(value).some(containsJsonPointer);
  return false;
}

/** Finds the token an alias such as `{a.b}` points to; a group alias falls back to its `$root`. */
export function lookupToken(tokens: TokenMap, reference: string): FlatToken | undefined {
  return tokens.get(reference) ?? tokens.get(`${reference}.$root`);
}
