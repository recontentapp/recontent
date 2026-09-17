import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const codeRoot = style({
  display: "inline-block",
  boxSizing: "border-box",
  color: vars.system.colors.textPrimary,
  backgroundColor: vars.system.colors.backgroundBody,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.inner,
  paddingLeft: vars.ref.spacing[8],
  paddingRight: vars.ref.spacing[8],
  paddingTop: vars.ref.spacing[2],
  paddingBottom: vars.ref.spacing[2],
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
    fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
    fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
    letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
    lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
});
