import { style, styleVariants } from "@vanilla-extract/css";
import { refFontSizeScale, vars } from "../../tokens.css";

export const avatarRoot = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  overflow: "hidden",
  flexShrink: 0,
  backgroundColor: vars.system.colors.accent,
  borderRadius: "9999px",
});

export const avatarSize = styleVariants(refFontSizeScale, (value) => ({
  width: value,
  height: value,
}));

export const avatarShapeSquare = style({
  borderRadius: vars.ref.radius.element,
});

export const avatarImage = style({
  width: "100%",
  height: "100%",
  objectFit: "cover",
});

export const avatarFallback = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: vars.system.colors.onAccent,
  fontFamily: vars.system.textStyles.body.fontFamily,
    fontSize: vars.system.textStyles.body.fontSize,
    fontWeight: vars.system.textStyles.body.fontWeight,
    letterSpacing: vars.system.textStyles.body.letterSpacing,
    lineHeight: vars.system.textStyles.body.lineHeight,
});
