const themeRef = {
  color: {
    danger: {
      "50": "#ffebee",
      "100": "#f7d6db",
      "200": "#efadb7",
      "300": "#e88392",
      "400": "#e05a6e",
      "500": "#d8314a",
      "600": "#ad273b",
      "700": "#821d2c",
      "800": "#56141e",
      "900": "#410f16",
      "300-32": "#e8839252",
      "500-32": "#d8314a52",
    },
    info: {
      "50": "#ebf3ff",
      "100": "#d2e3ff",
      "200": "#a4c7ff",
      "300": "#77abff",
      "400": "#498fff",
      "500": "#1c73ff",
      "600": "#165ccc",
      "700": "#114599",
      "800": "#0b2e66",
      "900": "#08234d",
    },
    primary: {
      "25": "#f4faf9",
      "50": "#d9efeb",
      "100": "#b3ded7",
      "200": "#8ecec2",
      "300": "#68bdae",
      "400": "#42ad9a",
      "500": "#489993",
      "600": "#338585",
      "700": "#006666",
      "800": "#0f5757",
      "900": "#003d3d",
      "200-32": "#8ecec252",
      "700-32": "#00666652",
      "900-32": "#003d3d52",
    },
    secondary: {
      "25": "#fafafb",
      "50": "#f2f2f3",
      "100": "#e4e5e7",
      "200": "#d6d9db",
      "300": "#babfc5",
      "400": "#9ea5ad",
      "500": "#6c767f",
      "600": "#4e575f",
      "700": "#39434c",
      "750": "#2a3137",
      "800": "#22292f",
      "900": "#141a1f",
      "900-10": "#141a1f1a",
      "900-15": "#141a1f26",
      "900-20": "#141a1f33",
      "900-50": "#141a1f80",
    },
    success: {
      "50": "#e9fbe9",
      "100": "#d2eeda",
      "200": "#a6dcb6",
      "300": "#7bcb93",
      "400": "#4fb96f",
      "500": "#23a84b",
      "600": "#1c863c",
      "700": "#15652d",
      "800": "#0e431e",
      "900": "#0b3217",
    },
    warning: {
      "50": "#fff2e5",
      "100": "#ffe7d1",
      "200": "#ffd6b2",
      "300": "#ffc28c",
      "400": "#ffad65",
      "500": "#ff993f",
      "600": "#ce7c32",
      "700": "#9e5e26",
      "800": "#6d4119",
      "900": "#3d230d",
    },
    white: {
      "10": "#ffffff1a",
      "32": "#ffffff52",
      "60": "#ffffff99",
      "90": "#ffffffe5",
      "100": "#ffffff",
    },
  },
  spacing: {
    "0": "0px",
    "2": "2px",
    "4": "4px",
    "8": "8px",
    "12": "12px",
    "16": "16px",
    "20": "20px",
    "24": "24px",
    "32": "32px",
    "40": "40px",
    "48": "48px",
    "56": "56px",
    "64": "64px",
    "72": "72px",
    "80": "80px",
  },
  radius: {
    none: "0px",
    inner: "2px",
    element: "4px",
    container: "8px",
    page: "28px",
    full: "9999px",
  },
  fontSize: {
    xs: "10px",
    sm: "12px",
    base: "14px",
    lg: "17px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "30px",
    "4xl": "36px",
  },
  overlayWidth: {
    sm: "24rem",
    md: "32rem",
    lg: "48rem",
    fullscreen: "96rem",
  },
  iconScale: {
    xs: "10px",
    sm: "12px",
    base: "14px",
    lg: "17px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "30px",
    "4xl": "36px",
  },
  typographyScale: {
    "heading-branding-page-l": {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      fontSize: "48px",
      fontWeight: 600,
      letterSpacing: "0px",
      lineHeight: 1.2083,
    },
    "heading-branding-page": {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      fontSize: "32px",
      fontWeight: 600,
      letterSpacing: "0px",
      lineHeight: 1.25,
    },
    "heading-page-l": {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      fontSize: "24px",
      fontWeight: 700,
      letterSpacing: "0px",
      lineHeight: 1.25,
    },
    "heading-page": {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      fontSize: "22px",
      fontWeight: 600,
      letterSpacing: "0px",
      lineHeight: 1.3636,
    },
    "heading-section-1": {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      fontSize: "20px",
      fontWeight: 600,
      letterSpacing: "0px",
      lineHeight: 1.5,
    },
    "heading-section-2": {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      fontSize: "18px",
      fontWeight: 600,
      letterSpacing: "0px",
      lineHeight: 1.3333,
    },
    "heading-section-3": {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      fontSize: "16px",
      fontWeight: 600,
      letterSpacing: "0px",
      lineHeight: 1.5,
    },
    "heading-section-4": {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      fontSize: "14px",
      fontWeight: 600,
      letterSpacing: "0px",
      lineHeight: 1.4286,
    },
    "paragraph-body-xl-strong": {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      fontSize: "18px",
      fontWeight: 500,
      letterSpacing: "0px",
      lineHeight: 1.3333,
    },
    "paragraph-body-xl": {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      fontSize: "18px",
      fontWeight: 400,
      letterSpacing: "0px",
      lineHeight: 1.3333,
    },
    "paragraph-body-l-strong": {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      fontSize: "16px",
      fontWeight: 500,
      letterSpacing: "0px",
      lineHeight: 1.5,
    },
    "paragraph-body-l": {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      fontSize: "16px",
      fontWeight: 400,
      letterSpacing: "0px",
      lineHeight: 1.5,
    },
    "paragraph-body-m-strong": {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      fontSize: "14px",
      fontWeight: 600,
      letterSpacing: "0px",
      lineHeight: 1.4286,
    },
    "paragraph-body-m": {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      fontSize: "14px",
      fontWeight: 400,
      letterSpacing: "0px",
      lineHeight: 1.4286,
    },
    clickable: {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      fontSize: "14px",
      fontWeight: 500,
      letterSpacing: "0px",
      lineHeight: 1.4286,
    },
    "tiny-caption-strong": {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      fontSize: "12px",
      fontWeight: 700,
      letterSpacing: "0px",
      lineHeight: 1.3333,
    },
    "tiny-caption": {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      fontSize: "12px",
      fontWeight: 500,
      letterSpacing: "0px",
      lineHeight: 1.3333,
    },
    "tiny-subcaption": {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      fontSize: "10px",
      fontWeight: 500,
      letterSpacing: "0px",
      lineHeight: 1,
    },
  },
} as const;

const themeSystem = {
  colors: {
    accent: themeRef.color.primary[700],
    onAccent: themeRef.color.white[100],
    backgroundSurface: themeRef.color.white[100],
    backgroundBody: themeRef.color.secondary[25],
    backgroundCard: themeRef.color.white[100],
    backgroundMuted: themeRef.color.secondary[50],
    textPrimary: themeRef.color.secondary[900],
    textSecondary: themeRef.color.secondary[600],
    textDisabled: themeRef.color.secondary[400],
    border: themeRef.color.secondary[200],
    borderEmphasized: themeRef.color.secondary[400],
    skeleton: themeRef.color.secondary[200],
    success: themeRef.color.success[500],
    warning: themeRef.color.warning[500],
    error: themeRef.color.danger[500],
    onSuccess: themeRef.color.white[100],
    onWarning: themeRef.color.secondary[900],
    onError: themeRef.color.white[100],
    secondary: {
      "200": themeRef.color.primary[700],
    },
    textScale: {
      primary: themeRef.color.secondary[900],
      secondary: themeRef.color.secondary[600],
      disabled: themeRef.color.secondary[400],
      accent: themeRef.color.primary[700],
    },
  },
  spacing: {
    "0": themeRef.spacing[0],
    "2": themeRef.spacing[2],
    "4": themeRef.spacing[4],
    "8": themeRef.spacing[8],
    "12": themeRef.spacing[12],
    "16": themeRef.spacing[16],
    "20": themeRef.spacing[20],
    "24": themeRef.spacing[24],
    "32": themeRef.spacing[32],
    "40": themeRef.spacing[40],
    "48": themeRef.spacing[48],
    "56": themeRef.spacing[56],
    "64": themeRef.spacing[64],
    "72": themeRef.spacing[72],
    "80": themeRef.spacing[80],
  },
  radius: {
    none: themeRef.radius.none,
    inner: themeRef.radius.inner,
    element: themeRef.radius.element,
    container: themeRef.radius.container,
    page: themeRef.radius.page,
    full: themeRef.radius.full,
  },
  typography: {
    bodyFontFamily:
      "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    codeFontFamily: "SF Mono, Monaco, Consolas, monospace",
  },
  motion: {
    fast: "175ms",
    medium: "410ms",
    mediumMax: "550ms",
    slowMin: "730ms",
    standard: "cubic-bezier(0.24, 1, 0.4, 1)",
  },
  elevationScale: {
    sm: `0px 0px 2px 0px ${themeRef.color.secondary["900-20"]}, 0px 2px 10px 0px ${themeRef.color.secondary["900-10"]}`,
    md: `0px 0px 3px 0px ${themeRef.color.secondary["900-10"]}, 0px 4px 20px 0px ${themeRef.color.secondary["900-15"]}`,
    lg: `0px 0px 4px 0px ${themeRef.color.secondary["900-10"]}, 0px 8px 40px 0px ${themeRef.color.secondary["900-15"]}`,
    inset: `inset 0px 1px 2px 0px ${themeRef.color.secondary["900-10"]}`,
  },
  border: {
    default: `1px solid ${themeRef.color.secondary[200]}`,
  },
  borderScale: {
    thin: `1px solid ${themeRef.color.secondary[200]}`,
    thick: `2px solid ${themeRef.color.secondary[200]}`,
  },
  textScale: {
    "heading-branding-page-l": themeRef.typographyScale["heading-branding-page-l"],
    "heading-branding-page": themeRef.typographyScale["heading-branding-page"],
    "heading-page-l": themeRef.typographyScale["heading-page-l"],
    "heading-page": themeRef.typographyScale["heading-page"],
    "heading-section-1": themeRef.typographyScale["heading-section-1"],
    "heading-section-2": themeRef.typographyScale["heading-section-2"],
    "heading-section-3": themeRef.typographyScale["heading-section-3"],
    "heading-section-4": themeRef.typographyScale["heading-section-4"],
    "paragraph-body-xl-strong": themeRef.typographyScale["paragraph-body-xl-strong"],
    "paragraph-body-xl": themeRef.typographyScale["paragraph-body-xl"],
    "paragraph-body-l-strong": themeRef.typographyScale["paragraph-body-l-strong"],
    "paragraph-body-l": themeRef.typographyScale["paragraph-body-l"],
    "paragraph-body-m-strong": themeRef.typographyScale["paragraph-body-m-strong"],
    "paragraph-body-m": themeRef.typographyScale["paragraph-body-m"],
    clickable: themeRef.typographyScale.clickable,
    "tiny-caption-strong": themeRef.typographyScale["tiny-caption-strong"],
    "tiny-caption": themeRef.typographyScale["tiny-caption"],
    "tiny-subcaption": themeRef.typographyScale["tiny-subcaption"],
  },
  transitionScale: {
    fast: {
      transitionDuration: "100ms",
      transitionDelay: "0ms",
      transitionTimingFunction: "cubic-bezier(0.24, 1, 0.4, 1)",
    },
    slow: {
      transitionDuration: "400ms",
      transitionDelay: "0ms",
      transitionTimingFunction: "cubic-bezier(0.24, 1, 0.4, 1)",
    },
  },
  gradients: {
    accent: `linear-gradient(135deg, ${themeRef.color.primary[700]} 0%, ${themeRef.color.primary[500]} 100%)`,
  },
} as const;

const themeComponents = {} as const;

export const theme = { ref: themeRef, system: themeSystem, components: themeComponents };

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

export const refColorDanger = theme.ref.color.danger;

export type RefColorInfo = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export const refColorInfo = theme.ref.color.info;

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

export const refColorPrimary = theme.ref.color.primary;

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

export const refColorSecondary = theme.ref.color.secondary;

export type RefColorSuccess = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export const refColorSuccess = theme.ref.color.success;

export type RefColorWarning = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export const refColorWarning = theme.ref.color.warning;

export type RefColorWhite = 10 | 32 | 60 | 90 | 100;

export const refColorWhite = theme.ref.color.white;

export type RefSpacing = 0 | 2 | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 64 | 72 | 80;

export const refSpacing = theme.ref.spacing;

export type RefRadius = "none" | "inner" | "element" | "container" | "page" | "full";

export const refRadius = theme.ref.radius;

export type RefIconScale = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

export const refIconScale = theme.ref.iconScale;

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

export const refTypographyScale = theme.ref.typographyScale;

export type SystemColorsSecondary = 200;

export const systemColorsSecondary = theme.system.colors.secondary;

export type SystemColorsTextScale = "primary" | "secondary" | "disabled" | "accent";

export const systemColorsTextScale = theme.system.colors.textScale;

export type SystemSpacing = 0 | 2 | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 64 | 72 | 80;

export const systemSpacing = theme.system.spacing;

export type SystemRadius = "none" | "inner" | "element" | "container" | "page" | "full";

export const systemRadius = theme.system.radius;

export type SystemElevationScale = "sm" | "md" | "lg" | "inset";

export const systemElevationScale = theme.system.elevationScale;

export type SystemBorderScale = "thin" | "thick";

export const systemBorderScale = theme.system.borderScale;

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

export const systemTextScale = theme.system.textScale;

export type SystemTransitionScale = "fast" | "slow";

export const systemTransitionScale = theme.system.transitionScale;

export const themes = { theme } as const;
export type ThemeName = keyof typeof themes;
export type Theme = (typeof themes)[ThemeName];
export type BaseTheme = typeof theme;
