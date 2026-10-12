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
    gray: tokens.colorScale({
      50: "#fafafa",
      500: "#71717a",
      900: "#18181b",
    }),
  },
  spacing: tokens.dimensionScale({
    sm: "8px",
    md: "16px",
  }),
});

const system = defineSystemTokens({
  color: {
    background: ref.color.gray[50],
    text: ref.color.gray[900],
    muted: ref.color.gray[500],
  },
  spacing: ref.spacing,
  fontFamily: tokens.fontFamily("Inter, system-ui, sans-serif"),
});

const dark = defineTheme(system, {
  color: {
    background: tokens.color("#18181b"),
    text: tokens.color("#fafafa"),
  },
});

export default defineConfig({
  tokens: { ref, system, components: {} },
  themes: { dark },
  plugins: [
    stylex({
      outDir: "src/generated",
      fontFamily: system.fontFamily,
      placeholderColor: system.color.muted,
    }),
  ],
});
