import {
  defineComponentTokens,
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "recontent";
import { docs } from "recontent/plugins";

const ref = defineReferenceTokens({
  color: {
    brand: { primary: tokens.color("#2563eb") },
    white: tokens.color("#ffffff"),
  },
  spacing: { 4: tokens.dimension("4px") },
});

const system = defineSystemTokens({
  color: {
    accent: ref.color.brand.primary.describe("Primary accent color."),
    surface: ref.color.white,
    legacy: ref.color.brand.primary.deprecate("Use system.color.accent."),
  },
  spacing: { sm: ref.spacing[4] },
});

const dark = defineTheme(ref, { color: { brand: { primary: tokens.color("#60a5fa") } } });

export default defineConfig({
  tokens: { ref, system, components: defineComponentTokens({}) },
  themes: { dark },
  introspection: { entry: "src/index.ts" },
  plugins: [docs({ outDir: "docs", markdown: true })],
});
