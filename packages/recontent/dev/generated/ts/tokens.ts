const themeRef = {
  color: {
    blue600: "#0064e0",
    blue500: "#2694fe",
    gray950: "#0a1317",
    gray700: "#4e606f",
    gray400: "#a4b0bc",
    gray300: "#ccd3db",
    gray100: "#f1f4f7",
    white: "#ffffff",
    surfaceDark: "#1f1f22",
    success: "#0d8626",
    warning: "#e9af08",
    error: "#e3193b",
    blueMuted: "#0171e333",
    purpleMuted: "#7952ff33",
  },
  spacing: {
    "0": "0px",
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "5": "20px",
    "6": "24px",
    "8": "32px",
    "10": "40px",
    "12": "48px",
    "0-5": "2px",
    "1-5": "6px",
  },
  radius: {
    none: "0px",
    inner: "4px",
    element: "8px",
    container: "12px",
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
} as const;

const themeSystem = {
  colors: {
    accent: themeRef.color.blue600,
    onAccent: themeRef.color.white,
    backgroundSurface: themeRef.color.white,
    backgroundBody: themeRef.color.gray100,
    backgroundCard: themeRef.color.white,
    backgroundMuted: themeRef.color.blueMuted,
    textPrimary: themeRef.color.gray950,
    textSecondary: themeRef.color.gray700,
    textDisabled: themeRef.color.gray400,
    border: themeRef.color.gray300,
    borderEmphasized: themeRef.color.gray400,
    skeleton: themeRef.color.gray300,
    success: themeRef.color.success,
    warning: themeRef.color.warning,
    error: themeRef.color.error,
    onSuccess: themeRef.color.white,
    onWarning: themeRef.color.gray950,
    onError: themeRef.color.white,
    secondary: {
      "200": themeRef.color.blue600,
    },
  },
  spacing: {
    "0": themeRef.spacing[0],
    "1": themeRef.spacing[1],
    "2": themeRef.spacing[2],
    "3": themeRef.spacing[3],
    "4": themeRef.spacing[4],
    "5": themeRef.spacing[5],
    "6": themeRef.spacing[6],
    "8": themeRef.spacing[8],
    "10": themeRef.spacing[10],
    "12": themeRef.spacing[12],
    "0-5": themeRef.spacing["0-5"],
    "1-5": themeRef.spacing["1-5"],
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
    supportingSize: themeRef.fontSize.sm,
    supportingLeading: 1.6667,
    bodySize: themeRef.fontSize.base,
    bodyLeading: 1.4286,
    heading1Size: themeRef.fontSize["4xl"],
    heading1Leading: 1,
    heading2Size: themeRef.fontSize.xl,
    heading2Leading: 1.4,
    heading3Size: themeRef.fontSize["2xl"],
    heading3Leading: 1.2,
    heading4Size: themeRef.fontSize.xl,
    heading4Leading: 1.25,
    heading5Size: themeRef.fontSize.lg,
    heading5Leading: 1.3,
    heading6Size: themeRef.fontSize.base,
    heading6Leading: 1.35,
    normalWeight: 400,
    mediumWeight: 500,
    semiboldWeight: 600,
    boldWeight: 700,
  },
  size: {
    elementSm: "28px",
    elementMd: "32px",
    elementLg: "36px",
    borderWidth: "1px",
  },
  motion: {
    fast: "175ms",
    medium: "410ms",
    mediumMax: "550ms",
    slowMin: "730ms",
    standard: "cubic-bezier(0.24, 1, 0.4, 1)",
  },
  elevation: {
    sm: `0px 1px 2px 0px ${themeRef.color.gray950}`,
    md: `0px 2px 4px 0px ${themeRef.color.gray950}, 0px 8px 16px -4px ${themeRef.color.gray950}`,
  },
  border: {
    default: `1px solid ${themeRef.color.gray300}`,
  },
  borderScale: {
    thin: `1px solid ${themeRef.color.gray300}`,
    thick: `2px solid ${themeRef.color.gray300}`,
  },
  textStyles: {
    body: {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      fontSize: themeRef.fontSize.base,
      fontWeight: 400,
      letterSpacing: "0px",
      lineHeight: 1.4286,
    },
  },
  transitions: {
    standard: {
      transitionDuration: "175ms",
      transitionDelay: "0ms",
      transitionTimingFunction: "cubic-bezier(0.24, 1, 0.4, 1)",
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
    accent: `linear-gradient(135deg, ${themeRef.color.blue600} 0%, ${themeRef.color.blue500} 100%)`,
  },
} as const;

const themeComponents = {} as const;

export const theme = { ref: themeRef, system: themeSystem, components: themeComponents };

const blackThemeRef = {
  color: {
    blue600: "#0064e0",
    blue500: "#2694fe",
    gray950: "#0a1317",
    gray700: "#4e606f",
    gray400: "#a4b0bc",
    gray300: "#ccd3db",
    gray100: "#f1f4f7",
    white: "#ffffff",
    surfaceDark: "#1f1f22",
    success: "#0d8626",
    warning: "#e9af08",
    error: "#e3193b",
    blueMuted: "#0171e333",
    purpleMuted: "#7952ff33",
  },
  spacing: {
    "0": "0px",
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "5": "20px",
    "6": "24px",
    "8": "32px",
    "10": "40px",
    "12": "48px",
    "0-5": "2px",
    "1-5": "6px",
  },
  radius: {
    none: "0px",
    inner: "4px",
    element: "8px",
    container: "12px",
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
} as const;

const blackThemeSystem = {
  colors: {
    accent: "#2694fe",
    onAccent: blackThemeRef.color.white,
    backgroundSurface: "#1f1f22",
    backgroundBody: "#111112",
    backgroundCard: "#1f1f22",
    backgroundMuted: blackThemeRef.color.blueMuted,
    textPrimary: "#dfe2e5",
    textSecondary: "#aaafb5",
    textDisabled: "#6f747c",
    border: "#f2f4f619",
    borderEmphasized: "#494d53",
    skeleton: "#5a5e66",
    success: blackThemeRef.color.success,
    warning: blackThemeRef.color.warning,
    error: blackThemeRef.color.error,
    onSuccess: blackThemeRef.color.white,
    onWarning: blackThemeRef.color.gray950,
    onError: blackThemeRef.color.white,
    secondary: {
      "200": "#2694fe",
    },
  },
  spacing: {
    "0": blackThemeRef.spacing[0],
    "1": blackThemeRef.spacing[1],
    "2": blackThemeRef.spacing[2],
    "3": blackThemeRef.spacing[3],
    "4": blackThemeRef.spacing[4],
    "5": blackThemeRef.spacing[5],
    "6": blackThemeRef.spacing[6],
    "8": blackThemeRef.spacing[8],
    "10": blackThemeRef.spacing[10],
    "12": blackThemeRef.spacing[12],
    "0-5": blackThemeRef.spacing["0-5"],
    "1-5": blackThemeRef.spacing["1-5"],
  },
  radius: {
    none: blackThemeRef.radius.none,
    inner: blackThemeRef.radius.inner,
    element: blackThemeRef.radius.element,
    container: blackThemeRef.radius.container,
    page: blackThemeRef.radius.page,
    full: blackThemeRef.radius.full,
  },
  typography: {
    bodyFontFamily:
      "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    codeFontFamily: "SF Mono, Monaco, Consolas, monospace",
    supportingSize: blackThemeRef.fontSize.sm,
    supportingLeading: 1.6667,
    bodySize: blackThemeRef.fontSize.base,
    bodyLeading: 1.4286,
    heading1Size: blackThemeRef.fontSize["4xl"],
    heading1Leading: 1,
    heading2Size: blackThemeRef.fontSize.xl,
    heading2Leading: 1.4,
    heading3Size: blackThemeRef.fontSize["2xl"],
    heading3Leading: 1.2,
    heading4Size: blackThemeRef.fontSize.xl,
    heading4Leading: 1.25,
    heading5Size: blackThemeRef.fontSize.lg,
    heading5Leading: 1.3,
    heading6Size: blackThemeRef.fontSize.base,
    heading6Leading: 1.35,
    normalWeight: 400,
    mediumWeight: 500,
    semiboldWeight: 600,
    boldWeight: 700,
  },
  size: {
    elementSm: "28px",
    elementMd: "32px",
    elementLg: "36px",
    borderWidth: "1px",
  },
  motion: {
    fast: "175ms",
    medium: "410ms",
    mediumMax: "550ms",
    slowMin: "730ms",
    standard: "cubic-bezier(0.24, 1, 0.4, 1)",
  },
  elevation: {
    sm: `0px 1px 2px 0px ${blackThemeRef.color.gray950}`,
    md: `0px 2px 4px 0px ${blackThemeRef.color.gray950}, 0px 8px 16px -4px ${blackThemeRef.color.gray950}`,
  },
  border: {
    default: `1px solid ${blackThemeRef.color.gray300}`,
  },
  borderScale: {
    thin: `1px solid ${blackThemeRef.color.gray300}`,
    thick: `2px solid ${blackThemeRef.color.gray300}`,
  },
  textStyles: {
    body: {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      fontSize: blackThemeRef.fontSize.base,
      fontWeight: 400,
      letterSpacing: "0px",
      lineHeight: 1.4286,
    },
  },
  transitions: {
    standard: {
      transitionDuration: "175ms",
      transitionDelay: "0ms",
      transitionTimingFunction: "cubic-bezier(0.24, 1, 0.4, 1)",
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
    accent: `linear-gradient(135deg, ${blackThemeRef.color.blue600} 0%, ${blackThemeRef.color.blue500} 100%)`,
  },
} as const;

const blackThemeComponents = {} as const;

export const blackTheme = {
  ref: blackThemeRef,
  system: blackThemeSystem,
  components: blackThemeComponents,
};

export type RefSpacing = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | "0-5" | "1-5";

export const refSpacing = theme.ref.spacing;

export type SystemColorsSecondary = 200;

export const systemColorsSecondary = theme.system.colors.secondary;

export type SystemSpacing = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | "0-5" | "1-5";

export const systemSpacing = theme.system.spacing;

export type SystemBorderScale = "thin" | "thick";

export const systemBorderScale = theme.system.borderScale;

export type SystemTransitionScale = "fast" | "slow";

export const systemTransitionScale = theme.system.transitionScale;

export const themes = { theme, blackTheme } as const;
export type ThemeName = keyof typeof themes;
export type Theme = (typeof themes)[ThemeName];
export type BaseTheme = typeof theme;
