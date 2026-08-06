import { expect, test } from "@jest/globals";
import {
  isRawToken,
  isStampedToken,
  isTokenLeaf,
  isTokenScale,
  pathKey,
} from "../../src/tokens/guards.js";

test("isRawToken recognizes raw tokens", () => {
  expect(isRawToken({ _kind: "raw", $value: 1 })).toBe(true);
  expect(isRawToken({ _kind: "stamped", $value: 1 })).toBe(false);
  expect(isRawToken({})).toBe(false);
  expect(isRawToken(null)).toBe(false);
  expect(isRawToken(undefined)).toBe(false);
  expect(isRawToken("raw")).toBe(false);
});

test("isStampedToken recognizes stamped tokens", () => {
  expect(isStampedToken({ _kind: "stamped", $value: 1 })).toBe(true);
  expect(isStampedToken({ _kind: "raw", $value: 1 })).toBe(false);
  expect(isStampedToken(null)).toBe(false);
});

test("isTokenScale recognizes token scales", () => {
  expect(isTokenScale({ _kind: "scale" })).toBe(true);
  expect(isTokenScale({ _kind: "raw" })).toBe(false);
  expect(isTokenScale(42)).toBe(false);
});

test("isTokenLeaf recognizes raw and stamped tokens but not scales", () => {
  expect(isTokenLeaf({ _kind: "raw", $value: 1 })).toBe(true);
  expect(isTokenLeaf({ _kind: "stamped", $value: 1 })).toBe(true);
  expect(isTokenLeaf({ _kind: "scale" })).toBe(false);
  expect(isTokenLeaf({})).toBe(false);
});

test("pathKey joins path segments with a dot", () => {
  expect(pathKey(["a", "b", "c"])).toBe("a.b.c");
  expect(pathKey(["single"])).toBe("single");
  expect(pathKey([])).toBe("");
});
