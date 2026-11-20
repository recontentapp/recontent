import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "recontent";
import { contrast } from "recontent/plugins";

const ref = defineReferenceTokens({
  color: {
    white: tokens.color("#ffffff"),
    gray100: tokens.color("#f4f4f5"),
    gray400: tokens.color("#a1a1aa"),
    gray600: tokens.color("#52525b"),
    gray900: tokens.color("#18181b"),
    blue: tokens.color("#2563eb"),
  },
});

const system = defineSystemTokens({
  color: {
    text: { default: ref.color.gray900, muted: ref.color.gray600 },
    surface: { default: ref.color.white, subtle: ref.color.gray100 },
    accent: ref.color.blue,
    onAccent: ref.color.white,
  },
});

const dark = defineTheme(system, {
  color: {
    text: { default: ref.color.white, muted: ref.color.gray400 },
    surface: { default: ref.color.gray900, subtle: ref.color.gray900 },
  },
});

export default defineConfig({
  tokens: { ref, system },
  themes: { dark },
  plugins: [
    contrast({
      rules: [
        // Every text color on every surface, in the base tokens and in `dark`.
        { foreground: "system.color.text", background: "system.color.surface" },
        { foreground: "system.color.onAccent", background: "system.color.accent", min: 3 },
      ],
    }),
  ],
});
