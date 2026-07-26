import { style, styleVariants } from "@vanilla-extract/css";
import { systemSpacing } from "../../tokens.css";

export const gridRoot = style({
  display: "grid",
  minWidth: 0,
});

export const gridGap = styleVariants(systemSpacing, (value) => ({
  gap: value,
}));
