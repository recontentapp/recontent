import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "recontent";
import { stylex } from "recontent/plugins";

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
});

const system = defineSystemTokens({
  colors: {
    accent: ref.color.primary[500],
    background: ref.color.neutral[0],
    surface: ref.color.neutral[100],
    text: ref.color.neutral[900],
    textMuted: ref.color.neutral[500],
    border: ref.color.neutral[300],
  },
  spacing: ref.spacing,
  radius: ref.radius,
  fontFamily: tokens.fontFamily(
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  ),
});

const dark = defineTheme(system, {
  colors: {
    background: tokens.color("#18181b"),
    surface: tokens.color("#27272a"),
    text: tokens.color("#f4f4f5"),
    textMuted: tokens.color("#a1a1aa"),
    border: tokens.color("#3f3f46"),
  },
});

export default defineConfig({
  tokens: { ref, system, components: {} },
  themes: { dark },
  plugins: [
    stylex({
      outDir: "src/generated/stylex",
      fontFamily: system.fontFamily,
      placeholderColor: system.colors.textMuted,
    }),
  ],
});
