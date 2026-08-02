import { style, styleVariants } from "@vanilla-extract/css";
import { refSpacing, vars } from "../../tokens.css";

export const stackRoot = style({
  display: "flex",
  flexDirection: "column",
  backgroundColor: vars.ref.color.blue500,
});

export const stackGap = styleVariants(refSpacing, (value) => ({
  gap: value,
}));
