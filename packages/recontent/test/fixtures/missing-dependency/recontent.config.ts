import {
  defineComponentTokens,
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  tokens,
} from "recontent";
import type { RecontentPlugin } from "recontent/plugins";

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

// A fabricated plugin whose declared dependency can never be resolved, so
// `doctor` reliably reports it as missing regardless of what happens to be
// hoisted into this monorepo's root node_modules.
const requiresUnresolvablePackage: RecontentPlugin = {
  name: "e2e:requires-unresolvable-package",
  dependencies: () => ({ "@recontent-e2e/does-not-exist": "^1.0.0" }),
};

export default defineConfig({
  tokens: { ref, system, components },
  plugins: [requiresUnresolvablePackage],
});
