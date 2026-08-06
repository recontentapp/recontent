import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const linkRoot = style({
  cursor: "pointer",
  color: vars.system.colors.accent,
  fontFamily: vars.system.textStyles.body.fontFamily,
    fontSize: vars.system.textStyles.body.fontSize,
    fontWeight: vars.system.textStyles.body.fontWeight,
    letterSpacing: vars.system.textStyles.body.letterSpacing,
    lineHeight: vars.system.textStyles.body.lineHeight,
  ":hover": {
    color: vars.ref.color.blue500,
  },
  ":visited": {
    color: vars.system.colors.accent,
  },
});

export const linkUnderline = styleVariants({
  always: { textDecorationLine: "underline" },
  hover: {
    textDecorationLine: "none",
    ":hover": { textDecorationLine: "underline" },
  },
  none: { textDecorationLine: "none" },
});
