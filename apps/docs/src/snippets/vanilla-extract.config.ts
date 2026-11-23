import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "recontent";
import { vanillaExtract } from "recontent/plugins";

const ref = defineReferenceTokens({
  color: {
    gray: tokens.colorScale({
      50: "#fafafa",
      500: "#71717a",
      900: "#18181b",
    }),
    blue: tokens.colorScale({
      500: "#2563eb",
    }),
  },
  spacing: tokens.dimensionScale({
    sm: "8px",
    md: "16px",
  }),
  fontFamily: {
    sans: tokens.fontFamily("Inter, system-ui, sans-serif"),
  },
});

const system = defineSystemTokens({
  color: {
    background: ref.color.gray[50],
    text: ref.color.gray[900],
    muted: ref.color.gray[500],
    accent: ref.color.blue[500],
  },
  spacing: ref.spacing,
  fontFamily: ref.fontFamily,
});

const dark = defineTheme(system, {
  color: {
    background: ref.color.gray[900],
    text: ref.color.gray[50],
  },
});

export default defineConfig({
  tokens: { ref, system },
  themes: { dark },
  plugins: [
    vanillaExtract({
      outDir: "src/generated",
    }),
  ],
});
