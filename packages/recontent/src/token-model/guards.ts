import type { RawToken, StampedToken, TokenScale } from "./model.js";

function hasKind(value: unknown, kind: string): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "_kind" in value &&
    (value as { _kind: unknown })._kind === kind
  );
}

export function isRawToken(value: unknown): value is RawToken {
  return hasKind(value, "raw");
}
export function isTokenScale(value: unknown): value is TokenScale {
  return hasKind(value, "scale");
}
export function isStampedToken(value: unknown): value is StampedToken {
  return hasKind(value, "stamped");
}
export function isTokenLeaf(value: unknown): value is RawToken | StampedToken {
  return isRawToken(value) || isStampedToken(value);
}
export function pathKey(path: string[]): string {
  return path.join(".");
}
