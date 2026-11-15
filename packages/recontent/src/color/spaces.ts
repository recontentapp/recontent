export const COLOR_SPACES = [
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
] as const;

export type ColorSpace = (typeof COLOR_SPACES)[number];

export type Component = number | "none";

export type ComponentRange = { min: number; max: number };

export function componentRanges(
  colorSpace: ColorSpace,
): [ComponentRange, ComponentRange, ComponentRange] {
  switch (colorSpace) {
    case "hsl":
      return [
        { min: 0, max: 360 },
        { min: 0, max: 100 },
        { min: 0, max: 100 },
      ];
    case "hwb":
      return [
        { min: 0, max: 360 },
        { min: 0, max: 100 },
        { min: 0, max: 100 },
      ];
    case "lab":
      return [
        { min: 0, max: 100 },
        { min: -125, max: 125 },
        { min: -125, max: 125 },
      ];
    case "lch":
      return [
        { min: 0, max: 100 },
        { min: 0, max: 150 },
        { min: 0, max: 360 },
      ];
    case "oklab":
      return [
        { min: 0, max: 1 },
        { min: -0.4, max: 0.4 },
        { min: -0.4, max: 0.4 },
      ];
    case "oklch":
      return [
        { min: 0, max: 1 },
        { min: 0, max: 0.4 },
        { min: 0, max: 360 },
      ];
    case "xyz-d65":
    case "xyz-d50":
      return [
        { min: 0, max: 1 },
        { min: 0, max: 1 },
        { min: 0, max: 1 },
      ];
    case "srgb":
    case "srgb-linear":
    case "display-p3":
    case "a98-rgb":
    case "prophoto-rgb":
    case "rec2020":
      return [
        { min: 0, max: 1 },
        { min: 0, max: 1 },
        { min: 0, max: 1 },
      ];
    default:
      throw new Error(`Unknown color space: ${colorSpace satisfies never}`);
  }
}

export function isColorSpace(value: string): value is ColorSpace {
  return (COLOR_SPACES as readonly string[]).includes(value);
}
