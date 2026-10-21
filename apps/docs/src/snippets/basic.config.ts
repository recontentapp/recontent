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
    blue: tokens.generateColorScale({ base: "#2563eb" }),
    gray: tokens.colorScale({
      50: "#fafafa",
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
    accent: ref.color.blue[9],
  },
  spacing: ref.spacing,
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
  plugins: [css({ outDir: "src/generated" })],
});
