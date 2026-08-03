import { createTheme, createThemeContract } from "@vanilla-extract/css";

export const vars = createThemeContract({
  ref: {},
  system: {
    color: {
      primary100: null,
      primary200: null,
      primary300: null,
      primary400: null,
      primary500: null,
      primary600: null,
      primary700: null,
      primary800: null,
      primary900: null,
    },
    spacing: {
      sm: null,
      md: null,
      lg: null,
    },
  },
  components: {
    box: {
      backgroundColor: null,
    },
  },
});

export type SystemColor =
  | "primary100"
  | "primary200"
  | "primary300"
  | "primary400"
  | "primary500"
  | "primary600"
  | "primary700"
  | "primary800"
  | "primary900";

export const systemColor = vars.system.color;

export type SystemSpacing = "sm" | "md" | "lg";

export const systemSpacing = vars.system.spacing;

export const refVars = vars.ref;
export const systemVars = vars.system;
export const componentVars = vars.components;

export const themeClass = createTheme(vars, {
  ref: {},
  system: {
    color: {
      primary100: "#000000",
      primary200: "#111111",
      primary300: "#222222",
      primary400: "#333333",
      primary500: "#444444",
      primary600: "#555555",
      primary700: "#666666",
      primary800: "#777777",
      primary900: "#888888",
    },
    spacing: {
      sm: "8px",
      md: "16px",
      lg: "24px",
    },
  },
  components: {
    box: {
      backgroundColor: vars.system.color.primary200,
    },
  },
});
