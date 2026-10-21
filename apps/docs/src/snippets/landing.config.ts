import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "recontent";
import { css, tailwind, typescript } from "recontent/plugins";

const ref = defineReferenceTokens({
  color: { blue: tokens.generateColorScale({ base: "#2563eb" }) },
});

const system = defineSystemTokens({
  color: { accent: ref.color.blue[9], surface: tokens.color("#ffffff") },
});

const dark = defineTheme(system, { color: { surface: tokens.color("#18181b") } });

export default defineConfig({
  tokens: { ref, system, components: {} },
  themes: { dark },
  plugins: [
    css({ outDir: "src/generated/css" }),
    tailwind({ outDir: "src/generated/tailwind", theme: { color: system.color } }),
    typescript({ outDir: "src/generated/ts" }),
  ],
});
