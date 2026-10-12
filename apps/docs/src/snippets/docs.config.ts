import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "recontent";
import { docs } from "recontent/plugins";

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
  tokens: { ref, system, components: {} },
  themes: { dark },
  plugins: [docs({ outDir: "docs", markdown: true, title: "Acme tokens" })],
});
