import * as stylex from "@stylexjs/stylex";
import { vars } from "./tokens.stylex.js";

export const darkTheme = stylex.createTheme(vars, {
  systemColorsBackground: '#18181b',
  systemColorsBorder: '#3f3f46',
  systemColorsSurface: '#27272a',
  systemColorsText: '#f4f4f5',
  systemColorsTextMuted: '#a1a1aa',
});
