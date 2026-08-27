import { vars } from "./tokens.stylex.js";

export type RefColorPrimary = 100 | 300 | 500 | 700 | 900;

export const refColorPrimary = {
  100: vars.refColorPrimary100,
  300: vars.refColorPrimary300,
  500: vars.refColorPrimary500,
  700: vars.refColorPrimary700,
  900: vars.refColorPrimary900,
} as const;

export type RefColorNeutral = 0 | 100 | 300 | 500 | 700 | 900;

export const refColorNeutral = {
  0: vars.refColorNeutral0,
  100: vars.refColorNeutral100,
  300: vars.refColorNeutral300,
  500: vars.refColorNeutral500,
  700: vars.refColorNeutral700,
  900: vars.refColorNeutral900,
} as const;

export type RefSpacing = "sm" | "md" | "lg" | "xl";

export const refSpacing = {
  sm: vars.refSpacingSm,
  md: vars.refSpacingMd,
  lg: vars.refSpacingLg,
  xl: vars.refSpacingXl,
} as const;

export type RefRadius = "sm" | "md" | "full";

export const refRadius = {
  sm: vars.refRadiusSm,
  md: vars.refRadiusMd,
  full: vars.refRadiusFull,
} as const;

export type SystemSpacing = "sm" | "md" | "lg" | "xl";

export const systemSpacing = {
  sm: vars.systemSpacingSm,
  md: vars.systemSpacingMd,
  lg: vars.systemSpacingLg,
  xl: vars.systemSpacingXl,
} as const;

export type SystemRadius = "sm" | "md" | "full";

export const systemRadius = {
  sm: vars.systemRadiusSm,
  md: vars.systemRadiusMd,
  full: vars.systemRadiusFull,
} as const;
