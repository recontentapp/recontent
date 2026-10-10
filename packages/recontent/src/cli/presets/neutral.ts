import type { InitPreset } from "./index.js";

const source = `import {
  defineComponentTokens,
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "recontent";

const oklch = (l: number, c = 0, h = 0, alpha = 1) =>
  tokens.color({ colorSpace: "oklch", components: [l, c, h], alpha });

const ref = defineReferenceTokens({
  color: {
    white: oklch(1),
    neutral: tokens.colorScale({
      50: oklch(0.985),
      100: oklch(0.97),
      200: oklch(0.922),
      300: oklch(0.87),
      400: oklch(0.708),
      500: oklch(0.556),
      600: oklch(0.439),
      700: oklch(0.371),
      800: oklch(0.269),
      900: oklch(0.205),
      950: oklch(0.145),
    }),
    red: oklch(0.577, 0.245, 27.325),
  },
  radius: {
    base: tokens.dimension("0.625rem"),
  },
  fontFamily: {
    sans: tokens.fontFamily(
      'Geist, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    ),
    mono: tokens.fontFamily(
      '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    ),
  },
  spacing: tokens.dimensionScale({
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    16: "4rem",
  }),
});

const system = defineSystemTokens({
  color: {
    background: ref.color.white,
    foreground: ref.color.neutral[950],
    card: ref.color.white,
    cardForeground: ref.color.neutral[950],
    popover: ref.color.white,
    popoverForeground: ref.color.neutral[950],
    primary: ref.color.neutral[900],
    primaryForeground: ref.color.neutral[50],
    secondary: ref.color.neutral[100],
    secondaryForeground: ref.color.neutral[900],
    muted: ref.color.neutral[100],
    mutedForeground: ref.color.neutral[500],
    accent: ref.color.neutral[100],
    accentForeground: ref.color.neutral[900],
    destructive: ref.color.red,
    border: ref.color.neutral[200],
    input: ref.color.neutral[200],
    ring: ref.color.neutral[400],
  },
  radius: {
    sm: tokens.dimension("0.375rem"), // base - 4px
    md: tokens.dimension("0.5rem"), // base - 2px
    lg: ref.radius.base,
    xl: tokens.dimension("0.875rem"), // base + 4px
  },
  spacing: ref.spacing,
  shadow: {
    xs: tokens.shadow({
      color: tokens.color("#0000000d"),
      offsetX: "0px",
      offsetY: "1px",
      blur: "2px",
      spread: "0px",
    }),
    sm: tokens.shadow([
      {
        color: tokens.color("#0000001a"),
        offsetX: "0px",
        offsetY: "1px",
        blur: "3px",
        spread: "0px",
      },
      {
        color: tokens.color("#0000001a"),
        offsetX: "0px",
        offsetY: "1px",
        blur: "2px",
        spread: "-1px",
      },
    ]),
    md: tokens.shadow([
      {
        color: tokens.color("#0000001a"),
        offsetX: "0px",
        offsetY: "4px",
        blur: "6px",
        spread: "-1px",
      },
      {
        color: tokens.color("#0000001a"),
        offsetX: "0px",
        offsetY: "2px",
        blur: "4px",
        spread: "-2px",
      },
    ]),
  },
  typography: {
    body: tokens.typography({
      fontFamily: ref.fontFamily.sans,
      fontSize: "1rem",
      fontWeight: 400,
      lineHeight: 1.5,
    }),
    small: tokens.typography({
      fontFamily: ref.fontFamily.sans,
      fontSize: "0.875rem",
      fontWeight: 400,
      lineHeight: 1.4286,
    }),
    heading: tokens.typography({
      fontFamily: ref.fontFamily.sans,
      fontSize: "1.5rem",
      fontWeight: 600,
      letterSpacing: "-0.0375rem",
      lineHeight: 1.3333,
    }),
  },
});

const components = defineComponentTokens({});

const dark = defineTheme(system, {
  color: {
    background: oklch(0.145),
    foreground: oklch(0.985),
    card: oklch(0.205),
    cardForeground: oklch(0.985),
    popover: oklch(0.205),
    popoverForeground: oklch(0.985),
    primary: oklch(0.922),
    primaryForeground: oklch(0.205),
    secondary: oklch(0.269),
    secondaryForeground: oklch(0.985),
    muted: oklch(0.269),
    mutedForeground: oklch(0.708),
    accent: oklch(0.269),
    accentForeground: oklch(0.985),
    destructive: oklch(0.704, 0.191, 22.216),
    border: oklch(1, 0, 0, 0.1),
    input: oklch(1, 0, 0, 0.15),
    ring: oklch(0.556),
  },
});

export default defineConfig({
  tokens: { ref, system, components },
  themes: { dark },
});
`;

export const neutral: InitPreset = {
  name: "neutral",
  description: 'shadcn/ui "neutral" base color: OKLCH color roles, radius, shadows, light and dark',
  source,
};
