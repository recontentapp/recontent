import { expect, test } from "@jest/globals";
import {
  isRawToken,
  isStampedToken,
  isTokenLeaf,
  isTokenScale,
} from "../../src/token-model/guards.js";

const raw = { _kind: "raw", $value: 1 };
const stamped = { _kind: "stamped", $value: 1 };
const scale = { _kind: "scale" };

test.each([
  [isRawToken, [raw], [stamped, {}, null, undefined, "raw"]],
  [isStampedToken, [stamped], [raw, null]],
  [isTokenScale, [scale], [raw, 42]],
  [isTokenLeaf, [raw, stamped], [scale, {}]],
])("%p accepts only what it names", (guard, accepted, rejected) => {
  for (const value of accepted) expect(guard(value)).toBe(true);
  for (const value of rejected) expect(guard(value)).toBe(false);
});
