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
    blue: tokens.generateColorScale({ base: "#2563eb" }),
    gray: tokens.colorScale({
      50: "#fafafa",
      900: "#18181b",
    }),
  },
  spacing: tokens.dimension("4px"),
  fontFamily: {
    sans: tokens.fontFamily("Inter, system-ui, sans-serif"),
  },
});

const system = defineSystemTokens({
  color: {
    background: ref.color.gray[50],
    text: ref.color.gray[900],
    accent: ref.color.blue[9],
  },
  spacing: ref.spacing,
  fontFamily: ref.fontFamily,
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
    tailwind({
      outDir: "src/generated",
      resetDefaults: ["color"],
      theme: {
        color: system.color,
        spacing: system.spacing,
        font: system.fontFamily,
      },
    }),
  ],
});
