import { expect, test } from "@jest/globals";
import { componentRanges, isColorSpace } from "../../src/color/spaces.js";

const UNIT = [
  { min: 0, max: 1 },
  { min: 0, max: 1 },
  { min: 0, max: 1 },
];
const UNIT_SPACES = [
  "srgb",
  "srgb-linear",
  "display-p3",
  "a98-rgb",
  "prophoto-rgb",
  "rec2020",
] as const;

const UNBOUNDED = [
  { min: -Infinity, max: Infinity },
  { min: -Infinity, max: Infinity },
  { min: -Infinity, max: Infinity },
];

test.each([
  [
    "hsl",
    [
      { min: 0, max: 360 },
      { min: 0, max: 100 },
      { min: 0, max: 100 },
    ],
  ],
  [
    "oklch",
    [
      { min: 0, max: 1 },
      { min: 0, max: 0.4 },
      { min: 0, max: 360 },
    ],
  ],
  ...UNIT_SPACES.map((space) => [space, UNIT] as const),
  ["xyz-d65", UNBOUNDED] as const,
  ["xyz-d50", UNBOUNDED] as const,
] as const)("componentRanges(%s)", (space, ranges) => {
  expect(componentRanges(space)).toEqual(ranges);
});

test("isColorSpace recognizes spec spaces and rejects unknown strings", () => {
  for (const space of ["srgb", "oklch", "display-p3", "xyz-d50"]) {
    expect(isColorSpace(space)).toBe(true);
  }
  expect(isColorSpace("not-a-space")).toBe(false);
});
