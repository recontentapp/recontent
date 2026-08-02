import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "recontent";

const ref = defineReferenceTokens({
  color: {
    blue600: tokens.color("#0064e0"),
    blue500: tokens.color("#2694fe"),
    gray950: tokens.color("#0a1317"),
    gray700: tokens.color("#4e606f"),
    gray400: tokens.color("#a4b0bc"),
    gray300: tokens.color("#ccd3db"),
    gray100: tokens.color("#f1f4f7"),
    white: tokens.color("#ffffff"),
    surfaceDark: tokens.color("#1f1f22"),
    success: tokens.color("#0d8626"),
    warning: tokens.color("#e9af08"),
    error: tokens.color("#e3193b"),
    blueMuted: tokens.color("#0171e333"),
    purpleMuted: tokens.color("#7952ff33"),
  },
  spacing: tokens.dimensionScale({
    0: "0px",
    "0-5": "2px",
    1: "4px",
    "1-5": "6px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
    10: "40px",
    12: "48px",
  }),
  radius: {
    none: tokens.dimension("0px"),
    inner: tokens.dimension("4px"),
    element: tokens.dimension("8px"),
    container: tokens.dimension("12px"),
    page: tokens.dimension("28px"),
    full: tokens.dimension("9999px"),
  },
  fontSize: {
    xs: tokens.dimension("10px"),
    sm: tokens.dimension("12px"),
    base: tokens.dimension("14px"),
    lg: tokens.dimension("17px"),
    xl: tokens.dimension("20px"),
    "2xl": tokens.dimension("24px"),
    "3xl": tokens.dimension("30px"),
    "4xl": tokens.dimension("36px"),
  },
});

const system = defineSystemTokens({
  colors: {
    accent: ref.color.blue600,
    onAccent: ref.color.white,
    backgroundSurface: ref.color.white,
    backgroundBody: ref.color.gray100,
    backgroundCard: ref.color.white,
    backgroundMuted: ref.color.blueMuted,
    textPrimary: ref.color.gray950,
    textSecondary: ref.color.gray700,
    textDisabled: ref.color.gray400,
    border: ref.color.gray300,
    borderEmphasized: ref.color.gray400,
    skeleton: ref.color.gray300,
    success: ref.color.success,
    warning: ref.color.warning,
    error: ref.color.error,
    onSuccess: ref.color.white,
    onWarning: ref.color.gray950,
    onError: ref.color.white,
    secondary: tokens.colorScale({ 200: ref.color.blue600 }),
  },
  spacing: ref.spacing,
  radius: ref.radius,
  typography: {
    bodyFontFamily: tokens.fontFamily(
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    ),
    codeFontFamily: tokens.fontFamily('"SF Mono", Monaco, Consolas, monospace'),
    supportingSize: ref.fontSize.sm,
    supportingLeading: tokens.number(1.6667),
    bodySize: ref.fontSize.base,
    bodyLeading: tokens.number(1.4286),
    heading1Size: ref.fontSize["4xl"],
    heading1Leading: tokens.number(1),
    heading2Size: ref.fontSize.xl,
    heading2Leading: tokens.number(1.4),
    heading3Size: ref.fontSize["2xl"],
    heading3Leading: tokens.number(1.2),
    heading4Size: ref.fontSize.xl,
    heading4Leading: tokens.number(1.25),
    heading5Size: ref.fontSize.lg,
    heading5Leading: tokens.number(1.3),
    heading6Size: ref.fontSize.base,
    heading6Leading: tokens.number(1.35),
    normalWeight: tokens.fontWeight("regular"),
    mediumWeight: tokens.fontWeight("medium"),
    semiboldWeight: tokens.fontWeight("semibold"),
    boldWeight: tokens.fontWeight("bold"),
  },
  size: {
    elementSm: tokens.dimension("28px"),
    elementMd: tokens.dimension("32px"),
    elementLg: tokens.dimension("36px"),
    borderWidth: tokens.dimension("1px"),
  },
  motion: {
    fast: tokens.duration("175ms"),
    medium: tokens.duration("410ms"),
    mediumMax: tokens.duration("550ms"),
    slowMin: tokens.duration("730ms"),
    standard: tokens.cubicBezier([0.24, 1, 0.4, 1]),
  },
  elevation: {
    sm: tokens.shadow({
      color: ref.color.gray950,
      offsetX: "0px",
      offsetY: "1px",
      blur: "2px",
      spread: "0px",
    }),
    md: tokens.shadow([
      { color: ref.color.gray950, offsetX: "0px", offsetY: "2px", blur: "4px", spread: "0px" },
      {
        color: ref.color.gray950,
        offsetX: "0px",
        offsetY: "8px",
        blur: "16px",
        spread: "-4px",
      },
    ]),
  },
  border: {
    default: tokens.border({
      color: ref.color.gray300,
      width: "1px",
    }),
  },
  borderScale: tokens.borderScale({
    thin: { color: ref.color.gray300, width: "1px" },
    thick: { color: ref.color.gray300, width: "2px" },
  }),
  textStyles: {
    body: tokens.typography({
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontSize: ref.fontSize.base,
      fontWeight: "regular",
      lineHeight: 1.4286,
    }),
  },
  transitions: {
    standard: tokens.transition({
      duration: "175ms",
      timingFunction: [0.24, 1, 0.4, 1],
    }),
  },
  transitionScale: tokens.transitionScale({
    fast: { duration: "100ms", timingFunction: [0.24, 1, 0.4, 1] },
    slow: { duration: "400ms", timingFunction: [0.24, 1, 0.4, 1] },
  }),
  gradients: {
    accent: tokens.gradient({
      angle: "135deg",
      stops: [
        { color: ref.color.blue600, position: 0 },
        { color: ref.color.blue500, position: 1 },
      ],
    }),
  },
});

const blackTheme = defineTheme(system, {
  colors: {
    accent: tokens.color("#2694fe"),
    backgroundSurface: tokens.color("#1f1f22"),
    backgroundBody: tokens.color("#111112"),
    backgroundCard: tokens.color("#1f1f22"),
    textPrimary: tokens.color("#dfe2e5"),
    textSecondary: tokens.color("#aaafb5"),
    textDisabled: tokens.color("#6f747c"),
    border: tokens.color("#f2f4f619"),
    borderEmphasized: tokens.color("#494d53"),
    skeleton: tokens.color("#5a5e66"),
    secondary: tokens.colorScale({ 200: tokens.color("#2694fe") }),
  },
});

export default defineConfig({
  tokens: { ref, system, components: {} },
  themes: { blackTheme },
  output: [
    {
      target: "css",
      outDir: "dev/generated/css",
    },
    {
      target: "typescript",
      outDir: "dev/generated/ts",
    },
    {
      target: "typescript-native",
      outDir: "dev/generated/native",
    },
    {
      target: "vanilla-extract",
      outDir: "dev/generated/vanilla-extract",
      builtInComponents: {},
    },
  ],
});
