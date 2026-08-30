import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const linkRoot = style({
  cursor: "pointer",
  color: vars.system.colors.accent,
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
    fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
    fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
    letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
    lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
  ":hover": {
    color: vars.ref.color.primary[800],
  },
  ":visited": {
    color: vars.system.colors.accent,
  },
  ":focus-visible": {
    outline: "none",
    boxShadow: `0 0 0 2px ${vars.system.colors.accent}`,
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
