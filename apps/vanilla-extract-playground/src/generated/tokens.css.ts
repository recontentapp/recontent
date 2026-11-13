import { createTheme, createThemeContract } from "@vanilla-extract/css";

export const vars = createThemeContract({
  "ref": {},
  "system": {},
  "components": {},
});

export const refVars = vars.ref;
export const systemVars = vars.system;
export const componentVars = vars.components;

export const themeClass = createTheme(vars, {
  "ref": {},
  "system": {},
  "components": {},
});
