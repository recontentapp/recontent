import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "recontent";
import { designMD } from "recontent/plugins";

const ref = defineReferenceTokens({
  color: {
    white: tokens.color("#ffffff"),
    gray900: tokens.color("#18181b"),
  },
});

const system = defineSystemTokens({
  color: {
    background: ref.color.white.describe("Page background"),
    text: ref.color.gray900,
  },
});

const dark = defineTheme(system, {
  color: {
    background: tokens.color("#18181b"),
    text: tokens.color("#fafafa"),
  },
});

export default defineConfig({
  tokens: { ref, system },
  themes: { dark },
  introspection: { entry: "src/components/index.ts" },
  plugins: [
    designMD({
      outDir: "docs",
      title: "Acme design system",
      description: "Calm, dense UI for back-office tools.",
      dos: ["use system tokens in components"],
      donts: ["use ref tokens in components"],
    }),
  ],
});
