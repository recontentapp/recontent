import { createTheme, createThemeContract } from "@vanilla-extract/css";

export const vars = createThemeContract({
  ref: {
    color: {
      danger: {
        "50": null,
        "100": null,
        "200": null,
        "300": null,
        "400": null,
        "500": null,
        "600": null,
        "700": null,
        "800": null,
        "900": null,
        "300-32": null,
        "500-32": null,
      },
      info: {
        "50": null,
        "100": null,
        "200": null,
        "300": null,
        "400": null,
        "500": null,
        "600": null,
        "700": null,
        "800": null,
        "900": null,
      },
      primary: {
        "25": null,
        "50": null,
        "100": null,
        "200": null,
        "300": null,
        "400": null,
        "500": null,
        "600": null,
        "700": null,
        "800": null,
        "900": null,
        "200-32": null,
        "700-32": null,
        "900-32": null,
      },
      secondary: {
        "25": null,
        "50": null,
        "100": null,
        "200": null,
        "300": null,
        "400": null,
        "500": null,
        "600": null,
        "700": null,
        "750": null,
        "800": null,
        "900": null,
        "900-10": null,
        "900-15": null,
        "900-20": null,
        "900-50": null,
      },
      success: {
        "50": null,
        "100": null,
        "200": null,
        "300": null,
        "400": null,
        "500": null,
        "600": null,
        "700": null,
        "800": null,
        "900": null,
      },
      warning: {
        "50": null,
        "100": null,
        "200": null,
        "300": null,
        "400": null,
        "500": null,
        "600": null,
        "700": null,
        "800": null,
        "900": null,
      },
      white: {
        "10": null,
        "32": null,
        "60": null,
        "90": null,
        "100": null,
      },
    },
    spacing: {
      "0": null,
      "2": null,
      "4": null,
      "8": null,
      "12": null,
      "16": null,
      "20": null,
      "24": null,
      "32": null,
      "40": null,
      "48": null,
      "56": null,
      "64": null,
      "72": null,
      "80": null,
    },
    radius: {
      none: null,
      inner: null,
      element: null,
      container: null,
      page: null,
      full: null,
    },
    fontSize: {
      xs: null,
      sm: null,
      base: null,
      lg: null,
      xl: null,
      "2xl": null,
      "3xl": null,
      "4xl": null,
    },
    overlayWidth: {
      sm: null,
      md: null,
      lg: null,
      fullscreen: null,
    },
    iconScale: {
      xs: null,
      sm: null,
      base: null,
      lg: null,
      xl: null,
      "2xl": null,
      "3xl": null,
      "4xl": null,
    },
    typographyScale: {
      "heading-branding-page-l": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "heading-branding-page": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "heading-page-l": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "heading-page": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "heading-section-1": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "heading-section-2": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "heading-section-3": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "heading-section-4": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "paragraph-body-xl-strong": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "paragraph-body-xl": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "paragraph-body-l-strong": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "paragraph-body-l": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "paragraph-body-m-strong": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "paragraph-body-m": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      clickable: {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "tiny-caption-strong": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "tiny-caption": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "tiny-subcaption": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
    },
  },
  system: {
    colors: {
      accent: null,
      onAccent: null,
      backgroundSurface: null,
      backgroundBody: null,
      backgroundCard: null,
      backgroundMuted: null,
      textPrimary: null,
      textSecondary: null,
      textDisabled: null,
      border: null,
      borderEmphasized: null,
      skeleton: null,
      success: null,
      warning: null,
      error: null,
      onSuccess: null,
      onWarning: null,
      onError: null,
      secondary: {
        "200": null,
      },
      textScale: {
        primary: null,
        secondary: null,
        disabled: null,
        accent: null,
      },
    },
    spacing: {
      "0": null,
      "2": null,
      "4": null,
      "8": null,
      "12": null,
      "16": null,
      "20": null,
      "24": null,
      "32": null,
      "40": null,
      "48": null,
      "56": null,
      "64": null,
      "72": null,
      "80": null,
    },
    radius: {
      none: null,
      inner: null,
      element: null,
      container: null,
      page: null,
      full: null,
    },
    typography: {
      bodyFontFamily: null,
      codeFontFamily: null,
    },
    motion: {
      fast: null,
      medium: null,
      mediumMax: null,
      slowMin: null,
      standard: null,
    },
    elevationScale: {
      sm: null,
      md: null,
      lg: null,
      inset: null,
    },
    border: {
      default: null,
    },
    borderScale: {
      thin: null,
      thick: null,
    },
    textScale: {
      "heading-branding-page-l": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "heading-branding-page": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "heading-page-l": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "heading-page": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "heading-section-1": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "heading-section-2": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "heading-section-3": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "heading-section-4": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "paragraph-body-xl-strong": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "paragraph-body-xl": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "paragraph-body-l-strong": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "paragraph-body-l": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "paragraph-body-m-strong": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "paragraph-body-m": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      clickable: {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "tiny-caption-strong": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "tiny-caption": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
      "tiny-subcaption": {
        fontFamily: null,
        fontSize: null,
        fontWeight: null,
        letterSpacing: null,
        lineHeight: null,
      },
    },
    transitionScale: {
      fast: {
        transitionDuration: null,
        transitionDelay: null,
        transitionTimingFunction: null,
      },
      slow: {
        transitionDuration: null,
        transitionDelay: null,
        transitionTimingFunction: null,
      },
    },
    gradients: {
      accent: null,
    },
  },
  components: {
    switch: {
      trackWidth: null,
      trackHeight: null,
      thumbSize: null,
    },
  },
});

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

export const refColorDanger = vars.ref.color.danger;

export type RefColorInfo = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export const refColorInfo = vars.ref.color.info;

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

export const refColorPrimary = vars.ref.color.primary;

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

export const refColorSecondary = vars.ref.color.secondary;

export type RefColorSuccess = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export const refColorSuccess = vars.ref.color.success;

export type RefColorWarning = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export const refColorWarning = vars.ref.color.warning;

export type RefColorWhite = 10 | 32 | 60 | 90 | 100;

export const refColorWhite = vars.ref.color.white;

export type RefSpacing = 0 | 2 | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 64 | 72 | 80;

export const refSpacing = vars.ref.spacing;

export type RefRadius = "none" | "inner" | "element" | "container" | "page" | "full";

export const refRadius = vars.ref.radius;

export type RefIconScale = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

export const refIconScale = vars.ref.iconScale;

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

export const refTypographyScale = vars.ref.typographyScale;

export type SystemColorsSecondary = 200;

export const systemColorsSecondary = vars.system.colors.secondary;

export type SystemColorsTextScale = "primary" | "secondary" | "disabled" | "accent";

export const systemColorsTextScale = vars.system.colors.textScale;

export type SystemSpacing = 0 | 2 | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 64 | 72 | 80;

export const systemSpacing = vars.system.spacing;

export type SystemRadius = "none" | "inner" | "element" | "container" | "page" | "full";

export const systemRadius = vars.system.radius;

export type SystemElevationScale = "sm" | "md" | "lg" | "inset";

export const systemElevationScale = vars.system.elevationScale;

export type SystemBorderScale = "thin" | "thick";

export const systemBorderScale = vars.system.borderScale;

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

export const systemTextScale = vars.system.textScale;

export type SystemTransitionScale = "fast" | "slow";

export const systemTransitionScale = vars.system.transitionScale;

export const refVars = vars.ref;
export const systemVars = vars.system;
export const componentVars = vars.components;

export const themeClass = createTheme(vars, {
  ref: {
    color: {
      danger: {
        "50": "#fef2f2",
        "100": "#fee2e2",
        "200": "#fecaca",
        "300": "#fca5a5",
        "400": "#f87171",
        "500": "#ef4444",
        "600": "#dc2626",
        "700": "#b91c1c",
        "800": "#991b1b",
        "900": "#7f1d1d",
        "300-32": "#fca5a552",
        "500-32": "#ef444452",
      },
      info: {
        "50": "#eff6ff",
        "100": "#dbeafe",
        "200": "#bfdbfe",
        "300": "#93c5fd",
        "400": "#60a5fa",
        "500": "#3b82f6",
        "600": "#2563eb",
        "700": "#1d4ed8",
        "800": "#1e40af",
        "900": "#1e3a8a",
      },
      primary: {
        "25": "#fafafa",
        "50": "#fafafa",
        "100": "#f4f4f5",
        "200": "#e4e4e7",
        "300": "#d4d4d8",
        "400": "#a1a1aa",
        "500": "#71717a",
        "600": "#52525b",
        "700": "#18181b",
        "800": "#27272a",
        "900": "#09090b",
        "200-32": "#e4e4e752",
        "700-32": "#18181b52",
        "900-32": "#09090b52",
      },
      secondary: {
        "25": "#ffffff",
        "50": "#fafafa",
        "100": "#f4f4f5",
        "200": "#e4e4e7",
        "300": "#d4d4d8",
        "400": "#a1a1aa",
        "500": "#71717a",
        "600": "#52525b",
        "700": "#3f3f46",
        "750": "#27272a",
        "800": "#18181b",
        "900": "#09090b",
        "900-10": "#09090b1a",
        "900-15": "#09090b26",
        "900-20": "#09090b33",
        "900-50": "#09090b80",
      },
      success: {
        "50": "#f0fdf4",
        "100": "#dcfce7",
        "200": "#bbf7d0",
        "300": "#86efac",
        "400": "#4ade80",
        "500": "#22c55e",
        "600": "#16a34a",
        "700": "#15803d",
        "800": "#166534",
        "900": "#14532d",
      },
      warning: {
        "50": "#fffbeb",
        "100": "#fef3c7",
        "200": "#fde68a",
        "300": "#fcd34d",
        "400": "#fbbf24",
        "500": "#f59e0b",
        "600": "#d97706",
        "700": "#b45309",
        "800": "#92400e",
        "900": "#78350f",
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
      inner: "4px",
      element: "6px",
      container: "8px",
      page: "12px",
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
        fontWeight: "600",
        letterSpacing: "0px",
        lineHeight: "1.2083",
      },
      "heading-branding-page": {
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontSize: "32px",
        fontWeight: "600",
        letterSpacing: "0px",
        lineHeight: "1.25",
      },
      "heading-page-l": {
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontSize: "24px",
        fontWeight: "700",
        letterSpacing: "0px",
        lineHeight: "1.25",
      },
      "heading-page": {
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontSize: "22px",
        fontWeight: "600",
        letterSpacing: "0px",
        lineHeight: "1.3636",
      },
      "heading-section-1": {
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontSize: "20px",
        fontWeight: "600",
        letterSpacing: "0px",
        lineHeight: "1.5",
      },
      "heading-section-2": {
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontSize: "18px",
        fontWeight: "600",
        letterSpacing: "0px",
        lineHeight: "1.3333",
      },
      "heading-section-3": {
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontSize: "16px",
        fontWeight: "600",
        letterSpacing: "0px",
        lineHeight: "1.5",
      },
      "heading-section-4": {
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontSize: "14px",
        fontWeight: "600",
        letterSpacing: "0px",
        lineHeight: "1.4286",
      },
      "paragraph-body-xl-strong": {
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontSize: "18px",
        fontWeight: "500",
        letterSpacing: "0px",
        lineHeight: "1.3333",
      },
      "paragraph-body-xl": {
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontSize: "18px",
        fontWeight: "400",
        letterSpacing: "0px",
        lineHeight: "1.3333",
      },
      "paragraph-body-l-strong": {
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontSize: "16px",
        fontWeight: "500",
        letterSpacing: "0px",
        lineHeight: "1.5",
      },
      "paragraph-body-l": {
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontSize: "16px",
        fontWeight: "400",
        letterSpacing: "0px",
        lineHeight: "1.5",
      },
      "paragraph-body-m-strong": {
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontSize: "14px",
        fontWeight: "600",
        letterSpacing: "0px",
        lineHeight: "1.4286",
      },
      "paragraph-body-m": {
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontSize: "14px",
        fontWeight: "400",
        letterSpacing: "0px",
        lineHeight: "1.4286",
      },
      clickable: {
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontSize: "14px",
        fontWeight: "500",
        letterSpacing: "0px",
        lineHeight: "1.4286",
      },
      "tiny-caption-strong": {
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontSize: "12px",
        fontWeight: "700",
        letterSpacing: "0px",
        lineHeight: "1.3333",
      },
      "tiny-caption": {
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontSize: "12px",
        fontWeight: "500",
        letterSpacing: "0px",
        lineHeight: "1.3333",
      },
      "tiny-subcaption": {
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontSize: "10px",
        fontWeight: "500",
        letterSpacing: "0px",
        lineHeight: "1",
      },
    },
  },
  system: {
    colors: {
      accent: vars.ref.color.primary[700],
      onAccent: vars.ref.color.white[100],
      backgroundSurface: vars.ref.color.white[100],
      backgroundBody: vars.ref.color.secondary[50],
      backgroundCard: vars.ref.color.white[100],
      backgroundMuted: vars.ref.color.secondary[50],
      textPrimary: vars.ref.color.secondary[900],
      textSecondary: vars.ref.color.secondary[500],
      textDisabled: vars.ref.color.secondary[400],
      border: vars.ref.color.secondary[200],
      borderEmphasized: vars.ref.color.secondary[400],
      skeleton: vars.ref.color.secondary[200],
      success: vars.ref.color.success[500],
      warning: vars.ref.color.warning[500],
      error: vars.ref.color.danger[500],
      onSuccess: vars.ref.color.white[100],
      onWarning: vars.ref.color.secondary[900],
      onError: vars.ref.color.white[100],
      secondary: {
        "200": vars.ref.color.primary[700],
      },
      textScale: {
        primary: vars.ref.color.secondary[900],
        secondary: vars.ref.color.secondary[500],
        disabled: vars.ref.color.secondary[400],
        accent: vars.ref.color.primary[700],
      },
    },
    spacing: {
      "0": vars.ref.spacing[0],
      "2": vars.ref.spacing[2],
      "4": vars.ref.spacing[4],
      "8": vars.ref.spacing[8],
      "12": vars.ref.spacing[12],
      "16": vars.ref.spacing[16],
      "20": vars.ref.spacing[20],
      "24": vars.ref.spacing[24],
      "32": vars.ref.spacing[32],
      "40": vars.ref.spacing[40],
      "48": vars.ref.spacing[48],
      "56": vars.ref.spacing[56],
      "64": vars.ref.spacing[64],
      "72": vars.ref.spacing[72],
      "80": vars.ref.spacing[80],
    },
    radius: {
      none: vars.ref.radius.none,
      inner: vars.ref.radius.inner,
      element: vars.ref.radius.element,
      container: vars.ref.radius.container,
      page: vars.ref.radius.page,
      full: vars.ref.radius.full,
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
      sm: `0px 0px 2px 0px ${vars.ref.color.secondary["900-20"]}, 0px 2px 10px 0px ${vars.ref.color.secondary["900-10"]}`,
      md: `0px 0px 3px 0px ${vars.ref.color.secondary["900-10"]}, 0px 4px 20px 0px ${vars.ref.color.secondary["900-15"]}`,
      lg: `0px 0px 4px 0px ${vars.ref.color.secondary["900-10"]}, 0px 8px 40px 0px ${vars.ref.color.secondary["900-15"]}`,
      inset: `inset 0px 1px 2px 0px ${vars.ref.color.secondary["900-10"]}`,
    },
    border: {
      default: `1px solid ${vars.ref.color.secondary[200]}`,
    },
    borderScale: {
      thin: `1px solid ${vars.ref.color.secondary[200]}`,
      thick: `2px solid ${vars.ref.color.secondary[200]}`,
    },
    textScale: {
      "heading-branding-page-l": {
        fontFamily: vars.ref.typographyScale["heading-branding-page-l"].fontFamily,
        fontSize: vars.ref.typographyScale["heading-branding-page-l"].fontSize,
        fontWeight: vars.ref.typographyScale["heading-branding-page-l"].fontWeight,
        letterSpacing: vars.ref.typographyScale["heading-branding-page-l"].letterSpacing,
        lineHeight: vars.ref.typographyScale["heading-branding-page-l"].lineHeight,
      },
      "heading-branding-page": {
        fontFamily: vars.ref.typographyScale["heading-branding-page"].fontFamily,
        fontSize: vars.ref.typographyScale["heading-branding-page"].fontSize,
        fontWeight: vars.ref.typographyScale["heading-branding-page"].fontWeight,
        letterSpacing: vars.ref.typographyScale["heading-branding-page"].letterSpacing,
        lineHeight: vars.ref.typographyScale["heading-branding-page"].lineHeight,
      },
      "heading-page-l": {
        fontFamily: vars.ref.typographyScale["heading-page-l"].fontFamily,
        fontSize: vars.ref.typographyScale["heading-page-l"].fontSize,
        fontWeight: vars.ref.typographyScale["heading-page-l"].fontWeight,
        letterSpacing: vars.ref.typographyScale["heading-page-l"].letterSpacing,
        lineHeight: vars.ref.typographyScale["heading-page-l"].lineHeight,
      },
      "heading-page": {
        fontFamily: vars.ref.typographyScale["heading-page"].fontFamily,
        fontSize: vars.ref.typographyScale["heading-page"].fontSize,
        fontWeight: vars.ref.typographyScale["heading-page"].fontWeight,
        letterSpacing: vars.ref.typographyScale["heading-page"].letterSpacing,
        lineHeight: vars.ref.typographyScale["heading-page"].lineHeight,
      },
      "heading-section-1": {
        fontFamily: vars.ref.typographyScale["heading-section-1"].fontFamily,
        fontSize: vars.ref.typographyScale["heading-section-1"].fontSize,
        fontWeight: vars.ref.typographyScale["heading-section-1"].fontWeight,
        letterSpacing: vars.ref.typographyScale["heading-section-1"].letterSpacing,
        lineHeight: vars.ref.typographyScale["heading-section-1"].lineHeight,
      },
      "heading-section-2": {
        fontFamily: vars.ref.typographyScale["heading-section-2"].fontFamily,
        fontSize: vars.ref.typographyScale["heading-section-2"].fontSize,
        fontWeight: vars.ref.typographyScale["heading-section-2"].fontWeight,
        letterSpacing: vars.ref.typographyScale["heading-section-2"].letterSpacing,
        lineHeight: vars.ref.typographyScale["heading-section-2"].lineHeight,
      },
      "heading-section-3": {
        fontFamily: vars.ref.typographyScale["heading-section-3"].fontFamily,
        fontSize: vars.ref.typographyScale["heading-section-3"].fontSize,
        fontWeight: vars.ref.typographyScale["heading-section-3"].fontWeight,
        letterSpacing: vars.ref.typographyScale["heading-section-3"].letterSpacing,
        lineHeight: vars.ref.typographyScale["heading-section-3"].lineHeight,
      },
      "heading-section-4": {
        fontFamily: vars.ref.typographyScale["heading-section-4"].fontFamily,
        fontSize: vars.ref.typographyScale["heading-section-4"].fontSize,
        fontWeight: vars.ref.typographyScale["heading-section-4"].fontWeight,
        letterSpacing: vars.ref.typographyScale["heading-section-4"].letterSpacing,
        lineHeight: vars.ref.typographyScale["heading-section-4"].lineHeight,
      },
      "paragraph-body-xl-strong": {
        fontFamily: vars.ref.typographyScale["paragraph-body-xl-strong"].fontFamily,
        fontSize: vars.ref.typographyScale["paragraph-body-xl-strong"].fontSize,
        fontWeight: vars.ref.typographyScale["paragraph-body-xl-strong"].fontWeight,
        letterSpacing: vars.ref.typographyScale["paragraph-body-xl-strong"].letterSpacing,
        lineHeight: vars.ref.typographyScale["paragraph-body-xl-strong"].lineHeight,
      },
      "paragraph-body-xl": {
        fontFamily: vars.ref.typographyScale["paragraph-body-xl"].fontFamily,
        fontSize: vars.ref.typographyScale["paragraph-body-xl"].fontSize,
        fontWeight: vars.ref.typographyScale["paragraph-body-xl"].fontWeight,
        letterSpacing: vars.ref.typographyScale["paragraph-body-xl"].letterSpacing,
        lineHeight: vars.ref.typographyScale["paragraph-body-xl"].lineHeight,
      },
      "paragraph-body-l-strong": {
        fontFamily: vars.ref.typographyScale["paragraph-body-l-strong"].fontFamily,
        fontSize: vars.ref.typographyScale["paragraph-body-l-strong"].fontSize,
        fontWeight: vars.ref.typographyScale["paragraph-body-l-strong"].fontWeight,
        letterSpacing: vars.ref.typographyScale["paragraph-body-l-strong"].letterSpacing,
        lineHeight: vars.ref.typographyScale["paragraph-body-l-strong"].lineHeight,
      },
      "paragraph-body-l": {
        fontFamily: vars.ref.typographyScale["paragraph-body-l"].fontFamily,
        fontSize: vars.ref.typographyScale["paragraph-body-l"].fontSize,
        fontWeight: vars.ref.typographyScale["paragraph-body-l"].fontWeight,
        letterSpacing: vars.ref.typographyScale["paragraph-body-l"].letterSpacing,
        lineHeight: vars.ref.typographyScale["paragraph-body-l"].lineHeight,
      },
      "paragraph-body-m-strong": {
        fontFamily: vars.ref.typographyScale["paragraph-body-m-strong"].fontFamily,
        fontSize: vars.ref.typographyScale["paragraph-body-m-strong"].fontSize,
        fontWeight: vars.ref.typographyScale["paragraph-body-m-strong"].fontWeight,
        letterSpacing: vars.ref.typographyScale["paragraph-body-m-strong"].letterSpacing,
        lineHeight: vars.ref.typographyScale["paragraph-body-m-strong"].lineHeight,
      },
      "paragraph-body-m": {
        fontFamily: vars.ref.typographyScale["paragraph-body-m"].fontFamily,
        fontSize: vars.ref.typographyScale["paragraph-body-m"].fontSize,
        fontWeight: vars.ref.typographyScale["paragraph-body-m"].fontWeight,
        letterSpacing: vars.ref.typographyScale["paragraph-body-m"].letterSpacing,
        lineHeight: vars.ref.typographyScale["paragraph-body-m"].lineHeight,
      },
      clickable: {
        fontFamily: vars.ref.typographyScale.clickable.fontFamily,
        fontSize: vars.ref.typographyScale.clickable.fontSize,
        fontWeight: vars.ref.typographyScale.clickable.fontWeight,
        letterSpacing: vars.ref.typographyScale.clickable.letterSpacing,
        lineHeight: vars.ref.typographyScale.clickable.lineHeight,
      },
      "tiny-caption-strong": {
        fontFamily: vars.ref.typographyScale["tiny-caption-strong"].fontFamily,
        fontSize: vars.ref.typographyScale["tiny-caption-strong"].fontSize,
        fontWeight: vars.ref.typographyScale["tiny-caption-strong"].fontWeight,
        letterSpacing: vars.ref.typographyScale["tiny-caption-strong"].letterSpacing,
        lineHeight: vars.ref.typographyScale["tiny-caption-strong"].lineHeight,
      },
      "tiny-caption": {
        fontFamily: vars.ref.typographyScale["tiny-caption"].fontFamily,
        fontSize: vars.ref.typographyScale["tiny-caption"].fontSize,
        fontWeight: vars.ref.typographyScale["tiny-caption"].fontWeight,
        letterSpacing: vars.ref.typographyScale["tiny-caption"].letterSpacing,
        lineHeight: vars.ref.typographyScale["tiny-caption"].lineHeight,
      },
      "tiny-subcaption": {
        fontFamily: vars.ref.typographyScale["tiny-subcaption"].fontFamily,
        fontSize: vars.ref.typographyScale["tiny-subcaption"].fontSize,
        fontWeight: vars.ref.typographyScale["tiny-subcaption"].fontWeight,
        letterSpacing: vars.ref.typographyScale["tiny-subcaption"].letterSpacing,
        lineHeight: vars.ref.typographyScale["tiny-subcaption"].lineHeight,
      },
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
      accent: `linear-gradient(135deg, ${vars.ref.color.primary[700]} 0%, ${vars.ref.color.primary[500]} 100%)`,
    },
  },
  components: {
    switch: {
      trackWidth: "32px",
      trackHeight: "18px",
      thumbSize: "14px",
    },
  },
});
