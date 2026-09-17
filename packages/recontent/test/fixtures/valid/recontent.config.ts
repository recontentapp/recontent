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
  spacing: {
    4: tokens.dimension("4px"),
  },
});

const system = defineSystemTokens({
  color: {
    accent: ref.color.brand.primary,
  },
  spacing: {
    sm: ref.spacing[4],
  },
});

const components = defineComponentTokens({});

export default defineConfig({
  tokens: { ref, system, components },
  plugins: [css({ outDir: "dist" })],
});
