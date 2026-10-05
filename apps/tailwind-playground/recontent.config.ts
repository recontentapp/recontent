import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "recontent";
import { tailwind } from "recontent/plugins";

const ref = defineReferenceTokens({
  color: {
    primary: tokens.colorScale({
      100: tokens.color("#e0f2fe"),
      300: tokens.color("#7dd3fc"),
      500: tokens.color("#0ea5e9"),
      700: tokens.color("#0369a1"),
      900: tokens.color("#0c4a6e"),
    }),
    neutral: tokens.colorScale({
      0: tokens.color("#ffffff"),
      100: tokens.color("#f4f4f5"),
      300: tokens.color("#d4d4d8"),
      500: tokens.color("#71717a"),
      700: tokens.color("#3f3f46"),
      900: tokens.color("#18181b"),
    }),
    shadow: tokens.color("#00000026"),
  },
  spacing: tokens.dimensionScale({
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  }),
  radius: tokens.dimensionScale({
    sm: "4px",
    md: "8px",
    full: "9999px",
  }),
  fontFamily: {
    sans: tokens.fontFamily(
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    ),
    mono: tokens.fontFamily("ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"),
  },
});

const system = defineSystemTokens({
  colors: {
    background: ref.color.neutral[0],
    foreground: ref.color.neutral[900],
    mutedForeground: ref.color.neutral[500],
    surface: ref.color.neutral[100],
    border: ref.color.neutral[300],
    accent: ref.color.primary[500],
    accentStrong: ref.color.primary[700],
    accentForeground: ref.color.neutral[0],
  },
  spacing: ref.spacing,
  radius: ref.radius,
  fontFamily: {
    sans: ref.fontFamily.sans,
    mono: ref.fontFamily.mono,
  },
  typography: {
    eyebrow: tokens.typography({
      fontFamily: ref.fontFamily.sans,
      fontSize: "0.75rem",
      fontWeight: 600,
      letterSpacing: "1px",
    }),
    heading: tokens.typography({
      fontFamily: ref.fontFamily.sans,
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.25,
    }),
    body: tokens.typography({
      fontFamily: ref.fontFamily.sans,
      fontSize: "0.9rem",
      fontWeight: "regular",
      lineHeight: 1.5,
    }),
  },
  motion: {
    fast: tokens.duration("150ms"),
    ease: tokens.cubicBezier([0.4, 0, 0.2, 1]),
  },
  shadow: {
    card: tokens.shadow({
      color: ref.color.shadow,
      offsetX: "0px",
      offsetY: "4px",
      blur: "12px",
      spread: "0px",
    }),
  },
});

const dark = defineTheme(system, {
  colors: {
    background: tokens.color("#18181b"),
    foreground: tokens.color("#f4f4f5"),
    mutedForeground: tokens.color("#a1a1aa"),
    surface: tokens.color("#27272a"),
    border: tokens.color("#3f3f46"),
  },
});

export default defineConfig({
  tokens: { ref, system, components: {} },
  themes: { dark },
  plugins: [
    tailwind({
      outDir: "src/generated/tailwind",
      theme: {
        color: { primary: ref.color.primary, ...system.colors },
        spacing: system.spacing,
        radius: system.radius,
        font: system.fontFamily,
        text: system.typography,
        shadow: system.shadow,
        duration: { fast: system.motion.fast },
        defaults: {
          font: system.fontFamily.sans,
          monoFont: system.fontFamily.mono,
          transitionDuration: system.motion.fast,
          transitionTimingFunction: system.motion.ease,
        },
      },
    }),
  ],
});
