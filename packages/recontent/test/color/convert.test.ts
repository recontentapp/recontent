import { expect, test } from "@jest/globals";
import { fitOklchToSrgb, toOklch, toSrgbHex } from "../../src/color/convert.js";

type Space = Parameters<typeof toSrgbHex>[0];
type Components = Parameters<typeof toSrgbHex>[1];

test.each<[Space, Components, string]>([
  ["srgb", [1, 0, 0], "#ff0000"],
  ["srgb", [0, 1, 0], "#00ff00"],
  ["srgb", [0, 0, 1], "#0000ff"],
  ["srgb", ["none", "none", "none"], "#000000"],
  ["srgb", ["none", 1, "none"], "#00ff00"],
  ["hsl", [0, 100, 50], "#ff0000"],
  ["hsl", [120, 100, 50], "#00ff00"],
  ["hwb", [0, 0, 0], "#ff0000"],
  ["hwb", [0, 100, 0], "#ffffff"],
  ["srgb-linear", [1, 1, 1], "#ffffff"],
  ["oklch", [0, 0, 0], "#000000"],
  ["oklch", [1, 0, 0], "#ffffff"],
  // oklab(62.8% 0.2249 0.1258) is the documented OKLab equivalent of #ff0000.
  ["oklab", [0.628, 0.2249, 0.1258], "#ff0000"],
  ["lab", [0, 0, 0], "#000000"],
  ["lab", [100, 0, 0], "#ffffff"],
  ["lch", [0, 0, 0], "#000000"],
  ["lch", [100, 0, 0], "#ffffff"],
  ["display-p3", [1, 1, 1], "#ffffff"],
  ["display-p3", [0, 0, 0], "#000000"],
  ["a98-rgb", [1, 1, 1], "#ffffff"],
  ["prophoto-rgb", [1, 1, 1], "#ffffff"],
  ["rec2020", [1, 1, 1], "#ffffff"],
  ["xyz-d65", [0.9505, 1, 1.089], "#ffffff"],
  ["xyz-d50", [0.9643, 1, 0.8251], "#ffffff"],
])("toSrgbHex(%s, %j) is %s", (space, components, expected) => {
  const actual = toSrgbHex(space, components);

  expect(actual).toMatch(/^#[0-9a-f]{6}$/);
  // Allow +/-1 per channel for rounding across conversion matrices.
  for (const index of [1, 3, 5]) {
    const diff = Math.abs(
      parseInt(actual.slice(index, index + 2), 16) - parseInt(expected.slice(index, index + 2), 16),
    );
    expect(diff).toBeLessThanOrEqual(1);
  }
});

test("toSrgbHex clamps out-of-gamut values instead of throwing", () => {
  const hex = toSrgbHex("srgb", [1.5, -0.5, 0.5]);
  expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  expect(hex).toBe("#ff0080");
});

test("toOklch round-trips through toSrgbHex", () => {
  for (const hex of [
    [1, 0, 0],
    [51 / 255, 102 / 255, 230 / 255],
    [230 / 255, 230 / 255, 26 / 255],
    [0, 0, 0],
    [1, 1, 1],
  ] as const) {
    const oklch = toOklch("srgb", hex);
    expect(toSrgbHex("oklch", oklch)).toBe(toSrgbHex("srgb", hex));
  }
});

test("toOklch matches known reference values", () => {
  const [l, c, h] = toOklch("srgb", [1, 0, 0]);
  expect(l).toBeCloseTo(0.628, 3);
  expect(c).toBeCloseTo(0.2577, 3);
  expect(h).toBeCloseTo(29.23, 1);
  expect(toOklch("srgb", [1, 1, 1])[0]).toBeCloseTo(1, 4);
  expect(toOklch("srgb", [0.5, 0.5, 0.5])[1]).toBeCloseTo(0, 4);
});

test("fitOklchToSrgb leaves in-gamut colors untouched and reduces chroma otherwise", () => {
  expect(fitOklchToSrgb([0.7, 0.05, 250])).toEqual([0.7, 0.05, 250]);
  const [l, c, h] = fitOklchToSrgb([0.7, 0.4, 250]);
  expect(l).toBe(0.7);
  expect(h).toBe(250);
  expect(c).toBeGreaterThan(0.05);
  expect(c).toBeLessThan(0.4);
  const [r, g, b] = toSrgbRgbUnclamped(l, c, h);
  for (const v of [r, g, b]) {
    expect(v).toBeGreaterThanOrEqual(-1e-3);
    expect(v).toBeLessThanOrEqual(1 + 1e-3);
  }
});

function toSrgbRgbUnclamped(l: number, c: number, h: number): [number, number, number] {
  // Re-derive through toOklch: if the fitted color were out of gamut, the clamped round trip
  // would not preserve chroma.
  const hex = toSrgbHex("oklch", [l, c, h]);
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
  const back = toOklch("srgb", rgb);
  expect(back[1]).toBeCloseTo(c, 2);
  return rgb;
}
