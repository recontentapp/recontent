import {
  defineComponentTokens,
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  tokens,
} from "recontent";

const ref = defineReferenceTokens({ color: { white: tokens.color("#ffffff") } });
const system = defineSystemTokens({ color: { surface: ref.color.white } });

export default defineConfig({
  tokens: { ref, system, components: defineComponentTokens({}) },
  introspection: { entry: "src/does-not-exist.ts" },
});
