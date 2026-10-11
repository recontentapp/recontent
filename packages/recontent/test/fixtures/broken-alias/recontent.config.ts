import {
  defineComponentTokens,
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  tokens,
} from "recontent";
import { css } from "recontent/plugins";

const ref = defineReferenceTokens({
  color: {
    brand: {
      primary: tokens.color("#2563eb"),
    },
  },
});

const system = defineSystemTokens({
  color: {
    accent: ref.color.brand.primary,
  },
});

const components = defineComponentTokens({});

// `ref` is registered empty, so `system.color.accent` aliases a token
// that never makes it into the registry.
export default defineConfig({
  tokens: { ref: defineReferenceTokens({}), system, components },
  plugins: [css({ outDir: "dist" })],
});
