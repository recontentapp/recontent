import { style, styleVariants } from "@vanilla-extract/css";
import { refIconScale, vars } from "../../tokens.css";

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

export const avatarSize = styleVariants(refIconScale, (value) => ({
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
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
    fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
    fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
    letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
    lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
});
