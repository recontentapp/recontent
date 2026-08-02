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
    "0": 0,
    "1": 4,
    "2": 8,
    "3": 12,
    "4": 16,
    "5": 20,
    "6": 24,
    "8": 32,
    "10": 40,
    "12": 48,
    "0-5": 2,
    "1-5": 6,
  },
  radius: {
    none: 0,
    inner: 4,
    element: 8,
    container: 12,
    page: 28,
    full: 9999,
  },
  radiusScale: {
    none: 0,
    inner: 4,
    element: 8,
    container: 12,
    page: 28,
    full: 9999,
  },
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 17,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
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
    bodyFontFamily: "-apple-system",
    codeFontFamily: "SF Mono",
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
    normalWeight: "400",
    mediumWeight: "500",
    semiboldWeight: "600",
    boldWeight: "700",
  },
  size: {
    elementSm: 28,
    elementMd: 32,
    elementLg: 36,
    borderWidth: 1,
  },
  motion: {
    fast: 175,
    medium: 410,
    mediumMax: 550,
    slowMin: 730,
    standard: [0.24, 1, 0.4, 1],
  },
  elevation: {
    sm: {
      shadowColor: "#0a1317",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowRadius: 2,
      shadowOpacity: 1,
    },
    md: {
      shadowColor: "#0a1317",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowRadius: 4,
      shadowOpacity: 1,
    },
  },
  elevationScale: {
    sm: {
      shadowColor: "#0a1317",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowRadius: 2,
      shadowOpacity: 1,
    },
    md: {
      shadowColor: "#0a1317",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowRadius: 4,
      shadowOpacity: 1,
    },
  },
  border: {
    default: {
      borderColor: themeRef.color.gray300,
      borderWidth: 1,
      borderStyle: "solid",
    },
  },
  borderScale: {
    thin: {
      borderColor: themeRef.color.gray300,
      borderWidth: 1,
      borderStyle: "solid",
    },
    thick: {
      borderColor: themeRef.color.gray300,
      borderWidth: 2,
      borderStyle: "solid",
    },
  },
  textStyles: {
    body: {
      fontFamily: "-apple-system",
      fontSize: themeRef.fontSize.base,
      fontWeight: "400",
      letterSpacing: 0,
      lineHeight: 20.0004,
    },
  },
  transitions: {
    standard: {
      duration: 175,
      delay: 0,
      timingFunction: [0.24, 1, 0.4, 1],
    },
  },
  transitionScale: {
    fast: {
      duration: 100,
      delay: 0,
      timingFunction: [0.24, 1, 0.4, 1],
    },
    slow: {
      duration: 400,
      delay: 0,
      timingFunction: [0.24, 1, 0.4, 1],
    },
  },
  gradients: {
    accent: {
      kind: "linear",
      angle: "135deg",
      stops: [
        { color: themeRef.color.blue600, position: 0 },
        { color: themeRef.color.blue500, position: 1 },
      ],
    },
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
    "0": 0,
    "1": 4,
    "2": 8,
    "3": 12,
    "4": 16,
    "5": 20,
    "6": 24,
    "8": 32,
    "10": 40,
    "12": 48,
    "0-5": 2,
    "1-5": 6,
  },
  radius: {
    none: 0,
    inner: 4,
    element: 8,
    container: 12,
    page: 28,
    full: 9999,
  },
  radiusScale: {
    none: 0,
    inner: 4,
    element: 8,
    container: 12,
    page: 28,
    full: 9999,
  },
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 17,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
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
    bodyFontFamily: "-apple-system",
    codeFontFamily: "SF Mono",
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
    normalWeight: "400",
    mediumWeight: "500",
    semiboldWeight: "600",
    boldWeight: "700",
  },
  size: {
    elementSm: 28,
    elementMd: 32,
    elementLg: 36,
    borderWidth: 1,
  },
  motion: {
    fast: 175,
    medium: 410,
    mediumMax: 550,
    slowMin: 730,
    standard: [0.24, 1, 0.4, 1],
  },
  elevation: {
    sm: {
      shadowColor: "#0a1317",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowRadius: 2,
      shadowOpacity: 1,
    },
    md: {
      shadowColor: "#0a1317",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowRadius: 4,
      shadowOpacity: 1,
    },
  },
  elevationScale: {
    sm: {
      shadowColor: "#0a1317",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowRadius: 2,
      shadowOpacity: 1,
    },
    md: {
      shadowColor: "#0a1317",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowRadius: 4,
      shadowOpacity: 1,
    },
  },
  border: {
    default: {
      borderColor: blackThemeRef.color.gray300,
      borderWidth: 1,
      borderStyle: "solid",
    },
  },
  borderScale: {
    thin: {
      borderColor: blackThemeRef.color.gray300,
      borderWidth: 1,
      borderStyle: "solid",
    },
    thick: {
      borderColor: blackThemeRef.color.gray300,
      borderWidth: 2,
      borderStyle: "solid",
    },
  },
  textStyles: {
    body: {
      fontFamily: "-apple-system",
      fontSize: blackThemeRef.fontSize.base,
      fontWeight: "400",
      letterSpacing: 0,
      lineHeight: 20.0004,
    },
  },
  transitions: {
    standard: {
      duration: 175,
      delay: 0,
      timingFunction: [0.24, 1, 0.4, 1],
    },
  },
  transitionScale: {
    fast: {
      duration: 100,
      delay: 0,
      timingFunction: [0.24, 1, 0.4, 1],
    },
    slow: {
      duration: 400,
      delay: 0,
      timingFunction: [0.24, 1, 0.4, 1],
    },
  },
  gradients: {
    accent: {
      kind: "linear",
      angle: "135deg",
      stops: [
        { color: blackThemeRef.color.blue600, position: 0 },
        { color: blackThemeRef.color.blue500, position: 1 },
      ],
    },
  },
} as const;

const blackThemeComponents = {} as const;

export const blackTheme = {
  ref: blackThemeRef,
  system: blackThemeSystem,
  components: blackThemeComponents,
};

export const themes = { theme, blackTheme } as const;
export type ThemeName = keyof typeof themes;
export type Theme = (typeof themes)[ThemeName];
export type BaseTheme = typeof theme;
