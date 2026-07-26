import { style, styleVariants } from "@vanilla-extract/css";
import { systemSpacing, vars } from "../../tokens.css";

export const stackRoot = style({
  display: "flex",
  flexDirection: "column",
  backgroundColor: vars.system.colors.backgroundSurface,
});

export const stackGap = styleVariants(systemSpacing, (value) => ({
  gap: value,
}));
