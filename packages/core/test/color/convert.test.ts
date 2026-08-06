import { expect, test } from "@jest/globals";
import { toSrgbHex } from "../../src/color/convert.js";

function assertHexClose(actual: string, expected: string) {
  // Allow +/-1 per channel for rounding across conversion matrices.
  const a = actual.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  const e = expected.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  expect(a).toBeTruthy();
  expect(e).toBeTruthy();
  for (let i = 1; i <= 3; i++) {
    const diff = Math.abs(parseInt(a![i]!, 16) - parseInt(e![i]!, 16));
    expect(diff).toBeLessThanOrEqual(1);
  }
}

test("toSrgbHex is a no-op passthrough for srgb", () => {
  expect(toSrgbHex("srgb", [1, 0, 0])).toBe("#ff0000");
  expect(toSrgbHex("srgb", [0, 1, 0])).toBe("#00ff00");
  expect(toSrgbHex("srgb", [0, 0, 1])).toBe("#0000ff");
});

test("toSrgbHex always returns a 6-digit hex string", () => {
  const cases: Array<[Parameters<typeof toSrgbHex>[0], Parameters<typeof toSrgbHex>[1]]> = [
    ["srgb", [0.5, 0.2, 0.9]],
    ["hsl", [210, 50, 50]],
    ["oklch", [0.7, 0.1, 250]],
    ["lab", [50, 20, -30]],
  ];
  for (const [space, components] of cases) {
    const hex = toSrgbHex(space, components);
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  }
});

test("toSrgbHex converts hsl(0, 100%, 50%) to red", () => {
  assertHexClose(toSrgbHex("hsl", [0, 100, 50]), "#ff0000");
});

test("toSrgbHex converts hsl(120, 100%, 50%) to green", () => {
  assertHexClose(toSrgbHex("hsl", [120, 100, 50]), "#00ff00");
});

test("toSrgbHex converts hwb(0 0% 0%) to red", () => {
  assertHexClose(toSrgbHex("hwb", [0, 0, 0]), "#ff0000");
});

test("toSrgbHex converts hwb(0 100% 0%) to white", () => {
  assertHexClose(toSrgbHex("hwb", [0, 100, 0]), "#ffffff");
});

test("toSrgbHex converts srgb-linear white to srgb white", () => {
  assertHexClose(toSrgbHex("srgb-linear", [1, 1, 1]), "#ffffff");
});

test("toSrgbHex converts oklch black/white correctly", () => {
  assertHexClose(toSrgbHex("oklch", [0, 0, 0]), "#000000");
  assertHexClose(toSrgbHex("oklch", [1, 0, 0]), "#ffffff");
});

test("toSrgbHex converts oklab reference red (known CSS Color 4 value)", () => {
  // oklab(62.8% 0.2249 0.1258) is the documented OKLab equivalent of #ff0000.
  assertHexClose(toSrgbHex("oklab", [0.628, 0.2249, 0.1258]), "#ff0000");
});

test("toSrgbHex converts lab black/white correctly", () => {
  assertHexClose(toSrgbHex("lab", [0, 0, 0]), "#000000");
  assertHexClose(toSrgbHex("lab", [100, 0, 0]), "#ffffff");
});

test("toSrgbHex converts lch black/white correctly", () => {
  assertHexClose(toSrgbHex("lch", [0, 0, 0]), "#000000");
  assertHexClose(toSrgbHex("lch", [100, 0, 0]), "#ffffff");
});

test("toSrgbHex converts display-p3 white/black correctly", () => {
  assertHexClose(toSrgbHex("display-p3", [1, 1, 1]), "#ffffff");
  assertHexClose(toSrgbHex("display-p3", [0, 0, 0]), "#000000");
});

test("toSrgbHex converts a98-rgb, prophoto-rgb, rec2020 white to srgb white", () => {
  assertHexClose(toSrgbHex("a98-rgb", [1, 1, 1]), "#ffffff");
  assertHexClose(toSrgbHex("prophoto-rgb", [1, 1, 1]), "#ffffff");
  assertHexClose(toSrgbHex("rec2020", [1, 1, 1]), "#ffffff");
});

test("toSrgbHex converts xyz-d65 and xyz-d50 white points to srgb white", () => {
  assertHexClose(toSrgbHex("xyz-d65", [0.9505, 1, 1.089]), "#ffffff");
  assertHexClose(toSrgbHex("xyz-d50", [0.9643, 1, 0.8251]), "#ffffff");
});

test('toSrgbHex treats "none" components as 0', () => {
  expect(toSrgbHex("srgb", ["none", "none", "none"])).toBe("#000000");
  expect(toSrgbHex("srgb", ["none", 1, "none"])).toBe("#00ff00");
});

test("toSrgbHex clamps out-of-gamut values instead of throwing", () => {
  const hex = toSrgbHex("srgb", [1.5, -0.5, 0.5]);
  expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  expect(hex).toBe("#ff0080");
});
