import { vars } from "./tokens.stylex.js";

export type RefColorDanger =
  | 50
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | "300-32"
  | "500-32";

export const refColorDanger = {
  50: vars.refColorDanger50,
  100: vars.refColorDanger100,
  200: vars.refColorDanger200,
  300: vars.refColorDanger300,
  400: vars.refColorDanger400,
  500: vars.refColorDanger500,
  600: vars.refColorDanger600,
  700: vars.refColorDanger700,
  800: vars.refColorDanger800,
  900: vars.refColorDanger900,
  "300-32": vars.refColorDanger30032,
  "500-32": vars.refColorDanger50032,
} as const;

export type RefColorInfo = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export const refColorInfo = {
  50: vars.refColorInfo50,
  100: vars.refColorInfo100,
  200: vars.refColorInfo200,
  300: vars.refColorInfo300,
  400: vars.refColorInfo400,
  500: vars.refColorInfo500,
  600: vars.refColorInfo600,
  700: vars.refColorInfo700,
  800: vars.refColorInfo800,
  900: vars.refColorInfo900,
} as const;

export type RefColorPrimary =
  | 25
  | 50
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | "200-32"
  | "700-32"
  | "900-32";

export const refColorPrimary = {
  25: vars.refColorPrimary25,
  50: vars.refColorPrimary50,
  100: vars.refColorPrimary100,
  200: vars.refColorPrimary200,
  300: vars.refColorPrimary300,
  400: vars.refColorPrimary400,
  500: vars.refColorPrimary500,
  600: vars.refColorPrimary600,
  700: vars.refColorPrimary700,
  800: vars.refColorPrimary800,
  900: vars.refColorPrimary900,
  "200-32": vars.refColorPrimary20032,
  "700-32": vars.refColorPrimary70032,
  "900-32": vars.refColorPrimary90032,
} as const;

export type RefColorSecondary =
  | 25
  | 50
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 750
  | 800
  | 900
  | "900-10"
  | "900-15"
  | "900-20"
  | "900-50";

export const refColorSecondary = {
  25: vars.refColorSecondary25,
  50: vars.refColorSecondary50,
  100: vars.refColorSecondary100,
  200: vars.refColorSecondary200,
  300: vars.refColorSecondary300,
  400: vars.refColorSecondary400,
  500: vars.refColorSecondary500,
  600: vars.refColorSecondary600,
  700: vars.refColorSecondary700,
  750: vars.refColorSecondary750,
  800: vars.refColorSecondary800,
  900: vars.refColorSecondary900,
  "900-10": vars.refColorSecondary90010,
  "900-15": vars.refColorSecondary90015,
  "900-20": vars.refColorSecondary90020,
  "900-50": vars.refColorSecondary90050,
} as const;

export type RefColorSuccess = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export const refColorSuccess = {
  50: vars.refColorSuccess50,
  100: vars.refColorSuccess100,
  200: vars.refColorSuccess200,
  300: vars.refColorSuccess300,
  400: vars.refColorSuccess400,
  500: vars.refColorSuccess500,
  600: vars.refColorSuccess600,
  700: vars.refColorSuccess700,
  800: vars.refColorSuccess800,
  900: vars.refColorSuccess900,
} as const;

export type RefColorWarning = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export const refColorWarning = {
  50: vars.refColorWarning50,
  100: vars.refColorWarning100,
  200: vars.refColorWarning200,
  300: vars.refColorWarning300,
  400: vars.refColorWarning400,
  500: vars.refColorWarning500,
  600: vars.refColorWarning600,
  700: vars.refColorWarning700,
  800: vars.refColorWarning800,
  900: vars.refColorWarning900,
} as const;

export type RefColorWhite = 10 | 32 | 60 | 90 | 100;

export const refColorWhite = {
  10: vars.refColorWhite10,
  32: vars.refColorWhite32,
  60: vars.refColorWhite60,
  90: vars.refColorWhite90,
  100: vars.refColorWhite100,
} as const;

export type RefSpacing = 0 | 2 | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 64 | 72 | 80;

export const refSpacing = {
  0: vars.refSpacing0,
  2: vars.refSpacing2,
  4: vars.refSpacing4,
  8: vars.refSpacing8,
  12: vars.refSpacing12,
  16: vars.refSpacing16,
  20: vars.refSpacing20,
  24: vars.refSpacing24,
  32: vars.refSpacing32,
  40: vars.refSpacing40,
  48: vars.refSpacing48,
  56: vars.refSpacing56,
  64: vars.refSpacing64,
  72: vars.refSpacing72,
  80: vars.refSpacing80,
} as const;

export type RefRadius = "none" | "inner" | "element" | "container" | "page" | "full";

export const refRadius = {
  none: vars.refRadiusNone,
  inner: vars.refRadiusInner,
  element: vars.refRadiusElement,
  container: vars.refRadiusContainer,
  page: vars.refRadiusPage,
  full: vars.refRadiusFull,
} as const;

export type RefIconScale = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

export const refIconScale = {
  xs: vars.refIconScaleXs,
  sm: vars.refIconScaleSm,
  base: vars.refIconScaleBase,
  lg: vars.refIconScaleLg,
  xl: vars.refIconScaleXl,
  "2xl": vars.refIconScale2xl,
  "3xl": vars.refIconScale3xl,
  "4xl": vars.refIconScale4xl,
} as const;

export type RefTypographyScale =
  | "heading-branding-page-l"
  | "heading-branding-page"
  | "heading-page-l"
  | "heading-page"
  | "heading-section-1"
  | "heading-section-2"
  | "heading-section-3"
  | "heading-section-4"
  | "paragraph-body-xl-strong"
  | "paragraph-body-xl"
  | "paragraph-body-l-strong"
  | "paragraph-body-l"
  | "paragraph-body-m-strong"
  | "paragraph-body-m"
  | "clickable"
  | "tiny-caption-strong"
  | "tiny-caption"
  | "tiny-subcaption";

export type SystemColorsSecondary = 200;

export const systemColorsSecondary = {
  200: vars.systemColorsSecondary200,
} as const;

export type SystemColorsTextScale = "primary" | "secondary" | "disabled" | "accent";

export const systemColorsTextScale = {
  primary: vars.systemColorsTextScalePrimary,
  secondary: vars.systemColorsTextScaleSecondary,
  disabled: vars.systemColorsTextScaleDisabled,
  accent: vars.systemColorsTextScaleAccent,
} as const;

export type SystemSpacing = 0 | 2 | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 64 | 72 | 80;

export const systemSpacing = {
  0: vars.systemSpacing0,
  2: vars.systemSpacing2,
  4: vars.systemSpacing4,
  8: vars.systemSpacing8,
  12: vars.systemSpacing12,
  16: vars.systemSpacing16,
  20: vars.systemSpacing20,
  24: vars.systemSpacing24,
  32: vars.systemSpacing32,
  40: vars.systemSpacing40,
  48: vars.systemSpacing48,
  56: vars.systemSpacing56,
  64: vars.systemSpacing64,
  72: vars.systemSpacing72,
  80: vars.systemSpacing80,
} as const;

export type SystemRadius = "none" | "inner" | "element" | "container" | "page" | "full";

export const systemRadius = {
  none: vars.systemRadiusNone,
  inner: vars.systemRadiusInner,
  element: vars.systemRadiusElement,
  container: vars.systemRadiusContainer,
  page: vars.systemRadiusPage,
  full: vars.systemRadiusFull,
} as const;

export type SystemElevationScale = "sm" | "md" | "lg" | "inset";

export const systemElevationScale = {
  sm: vars.systemElevationScaleSm,
  md: vars.systemElevationScaleMd,
  lg: vars.systemElevationScaleLg,
  inset: vars.systemElevationScaleInset,
} as const;

export type SystemBorderScale = "thin" | "thick";

export const systemBorderScale = {
  thin: vars.systemBorderScaleThin,
  thick: vars.systemBorderScaleThick,
} as const;

export type SystemTextScale =
  | "heading-branding-page-l"
  | "heading-branding-page"
  | "heading-page-l"
  | "heading-page"
  | "heading-section-1"
  | "heading-section-2"
  | "heading-section-3"
  | "heading-section-4"
  | "paragraph-body-xl-strong"
  | "paragraph-body-xl"
  | "paragraph-body-l-strong"
  | "paragraph-body-l"
  | "paragraph-body-m-strong"
  | "paragraph-body-m"
  | "clickable"
  | "tiny-caption-strong"
  | "tiny-caption"
  | "tiny-subcaption";

export type SystemTransitionScale = "fast" | "slow";
