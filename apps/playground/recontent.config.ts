import {
  defineComponentTokens,
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  tokens,
} from "recontent";

const ref = defineReferenceTokens({});

const system = defineSystemTokens({
  color: tokens.colorScale({
    primary100: tokens.color("#000000"),
    primary200: tokens.color("#111111"),
    primary300: tokens.color("#222222"),
    primary400: tokens.color("#333333"),
    primary500: tokens.color("#444444"),
    primary600: tokens.color("#555555"),
    primary700: tokens.color("#666666"),
    primary800: tokens.color("#777777"),
    primary900: tokens.color("#888888"),
  }),
  spacing: tokens.dimensionScale({
    sm: "8px",
    md: "16px",
    lg: "24px",
  }),
});

const components = defineComponentTokens({
  box: {
    backgroundColor: system.color.primary200,
  },
});

export default defineConfig({
  tokens: { ref, system, components },
  output: {
    target: "vanilla-extract",
    outDir: "src/design-system",
    builtInComponents: {
      Stack: {
        spacing: system.spacing,
      },
    },
  },
});
