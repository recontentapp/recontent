import type { RawToken, StampedToken, TokenScale } from "./model.js";

export function isRawToken(value: unknown): value is RawToken {
  return (
    typeof value === "object" &&
    value !== null &&
    "_kind" in value &&
    (value as RawToken)._kind === "raw"
  );
}
export function isTokenScale(value: unknown): value is TokenScale {
  return (
    typeof value === "object" &&
    value !== null &&
    "_kind" in value &&
    (value as TokenScale)._kind === "scale"
  );
}
export function isStampedToken(value: unknown): value is StampedToken {
  return (
    typeof value === "object" &&
    value !== null &&
    "_kind" in value &&
    (value as StampedToken)._kind === "stamped"
  );
}
export function isTokenLeaf(value: unknown): value is RawToken | StampedToken {
  return isRawToken(value) || isStampedToken(value);
}
export function pathKey(path: string[]): string {
  return path.join(".");
}
