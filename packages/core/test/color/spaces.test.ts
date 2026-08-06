import { expect, test } from "@jest/globals";
import { componentRanges, isColorSpace } from "../../src/color/spaces.js";

test("componentRanges returns the expected ranges for angle/percentage spaces", () => {
  expect(componentRanges("hsl")).toEqual([
    { min: 0, max: 360 },
    { min: 0, max: 100 },
    { min: 0, max: 100 },
  ]);
  expect(componentRanges("oklch")).toEqual([
    { min: 0, max: 1 },
    { min: 0, max: 0.4 },
    { min: 0, max: 360 },
  ]);
});

test("componentRanges returns unit ranges for xyz and rgb-like spaces", () => {
  for (const space of [
    "srgb",
    "srgb-linear",
    "display-p3",
    "a98-rgb",
    "prophoto-rgb",
    "rec2020",
    "xyz-d65",
    "xyz-d50",
  ] as const) {
    expect(componentRanges(space)).toEqual([
      { min: 0, max: 1 },
      { min: 0, max: 1 },
      { min: 0, max: 1 },
    ]);
  }
});

test("isColorSpace recognizes all 14 spec spaces and rejects unknown strings", () => {
  for (const space of [
    "srgb",
    "srgb-linear",
    "hsl",
    "hwb",
    "lab",
    "lch",
    "oklab",
    "oklch",
    "display-p3",
    "a98-rgb",
    "prophoto-rgb",
    "rec2020",
    "xyz-d65",
    "xyz-d50",
  ]) {
    expect(isColorSpace(space)).toBe(true);
  }
  expect(isColorSpace("not-a-space")).toBe(false);
});
