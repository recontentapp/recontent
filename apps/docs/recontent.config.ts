import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "recontent";
import { css } from "recontent/plugins";

const ref = defineReferenceTokens({
  color: {
    white: tokens.color("#ffffff"),
    ink: tokens.color("#1b1a17"),
    lightInk: tokens.color("#5c5647"),
    inkAlpha: tokens.colorScale({ 8: "#1b1a1714", 12: "#1b1a171f" }),
    stone: tokens.color("#b9b2a0"),
    cream: tokens.colorScale({ 50: "#fff9e6", 100: "#fff1c2" }),
    yellow: tokens.colorScale({ 100: "#ffeb99", 300: "#ffd84d" }),
    green: tokens.colorScale({ 100: "#d5f4e4", 300: "#7ee2a8", 500: "#2db87c" }),
    coral: tokens.colorScale({
      100: "#ffd9cf",
      300: "#ff9a85",
      400: "#ff6b4d",
      500: "#f05a3c",
      700: "#b8321a",
    }),
    blue: tokens.colorScale({ 100: "#d3e2ff", 600: "#2563eb" }),
  },
  fontFamily: {
    display: tokens.fontFamily(
      '"Arial Black", "Helvetica Neue", Arial, "Segoe UI", system-ui, sans-serif',
    ),
    body: tokens.fontFamily(
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    ),
    mono: tokens.fontFamily(
      'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
    ),
  },
  fontWeight: {
    medium: tokens.fontWeight("medium"),
    semibold: tokens.fontWeight("semibold"),
    bold: tokens.fontWeight("bold"),
    extrabold: tokens.fontWeight("extrabold"),
    black: tokens.fontWeight("black"),
  },
  spacing: tokens.dimensionScale({
    xs: "0.5rem",
    sm: "1rem",
    md: "1.5rem",
    lg: "2rem",
    xl: "2.5rem",
    "2xl": "3rem",
    "3xl": "4rem",
  }),
  radius: tokens.dimensionScale({ sm: "6px", md: "8px", lg: "10px", full: "999px" }),
});

const hardShadow = <Color>(offset: string, color: Color) => {
  return { color, offsetX: offset, offsetY: offset, blur: "0px", spread: "0px" };
};

const system = defineSystemTokens({
  color: {
    background: ref.color.cream[50],
    backgroundStrong: ref.color.cream[100],
    surface: ref.color.white,
    foreground: ref.color.ink,
    inverse: ref.color.ink,
    onInverse: ref.color.cream[50],
    overlay: ref.color.inkAlpha[8],
    onAccent: ref.color.ink,
    overlayStrong: ref.color.inkAlpha[12],
    // The closing call-to-action band.
    callout: ref.color.yellow[300],
    accent: {
      yellow: ref.color.yellow[300],
      green: ref.color.green[500],
      coral: ref.color.coral[500],
      blue: ref.color.blue[600],
    },
    tone: {
      yellow: ref.color.yellow[100],
      green: ref.color.green[100],
      coral: ref.color.coral[100],
      blue: ref.color.blue[100],
    },
    syntax: {
      comment: ref.color.stone,
      string: ref.color.green[300],
      keyword: ref.color.coral[300],
      function: ref.color.yellow[300],
    },
    error: {
      squiggle: ref.color.coral[400],
      text: ref.color.coral[700],
    },
  },
  fontFamily: {
    display: ref.fontFamily.display,
    body: ref.fontFamily.body,
    mono: ref.fontFamily.mono,
  },
  fontWeight: ref.fontWeight,
  spacing: ref.spacing,
  radius: ref.radius,
  border: {
    thin: tokens.border({ color: ref.color.ink, width: "2px", style: "solid" }),
    default: tokens.border({ color: ref.color.ink, width: "3px", style: "solid" }),
    heavy: tokens.border({ color: ref.color.ink, width: "4px", style: "solid" }),
    focus: tokens.border({ color: ref.color.blue[600], width: "3px", style: "solid" }),
  },
  shadow: {
    sm: tokens.shadowScale({
      ink: hardShadow("4px", ref.color.ink),
      yellow: hardShadow("4px", ref.color.yellow[300]),
      green: hardShadow("4px", ref.color.green[500]),
      coral: hardShadow("4px", ref.color.coral[500]),
      blue: hardShadow("4px", ref.color.blue[600]),
    }),
    lg: tokens.shadowScale({
      ink: hardShadow("6px", ref.color.ink),
      green: hardShadow("6px", ref.color.green[500]),
      coral: hardShadow("6px", ref.color.coral[500]),
      blue: hardShadow("6px", ref.color.blue[600]),
    }),
    press: tokens.shadowScale({
      ink: hardShadow("2px", ref.color.ink),
      coral: hardShadow("2px", ref.color.coral[500]),
    }),
  },
  motion: {
    duration: tokens.duration("120ms"),
    easing: tokens.cubicBezier([0.25, 0.1, 0.25, 1]),
  },
});

const dark = defineTheme(system, {
  color: {
    background: tokens.color("#1b1a17"),
    backgroundStrong: tokens.color("#2b2924"),
    surface: tokens.color("#262420"),
    foreground: tokens.color("#fff9e6"),
    inverse: tokens.color("#0e0d0b"),
    overlay: tokens.color("#fff9e61a"),
    overlayStrong: tokens.color("#fff9e629"),
    callout: tokens.color("#4a3a0c"),
    tone: {
      yellow: tokens.color("#54400a"),
      green: tokens.color("#124a34"),
      coral: tokens.color("#5e2417"),
      blue: tokens.color("#1d3570"),
    },
    error: { text: tokens.color("#ff9a85") },
  },
  border: {
    thin: tokens.border({ color: ref.color.cream[50], width: "2px", style: "solid" }),
    default: tokens.border({ color: ref.color.cream[50], width: "3px", style: "solid" }),
    heavy: tokens.border({ color: ref.color.cream[50], width: "4px", style: "solid" }),
    focus: tokens.border({ color: "#7aa7ff", width: "3px", style: "solid" }),
  },
  shadow: {
    sm: tokens.shadowScale({
      ink: hardShadow("4px", ref.color.lightInk),
      yellow: hardShadow("4px", ref.color.yellow[300]),
      green: hardShadow("4px", ref.color.green[500]),
      coral: hardShadow("4px", ref.color.coral[500]),
      blue: hardShadow("4px", ref.color.blue[600]),
    }),
    lg: tokens.shadowScale({
      ink: hardShadow("6px", ref.color.lightInk),
      green: hardShadow("6px", ref.color.green[500]),
      coral: hardShadow("6px", ref.color.coral[500]),
      blue: hardShadow("6px", ref.color.blue[600]),
    }),
    press: tokens.shadowScale({
      ink: hardShadow("2px", ref.color.lightInk),
      coral: hardShadow("2px", ref.color.coral[500]),
    }),
  },
});

export default defineConfig({
  tokens: { ref, system, components: {} },
  themes: { dark },
  plugins: [css({ outDir: "src/generated", themeSelector: "attribute" })],
});
