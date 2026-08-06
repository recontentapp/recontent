import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const keyboardShortcutRoot = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.ref.spacing["0-5"],
});

export const keyboardShortcutKey = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  color: vars.system.colors.textPrimary,
  backgroundColor: vars.system.colors.backgroundBody,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.inner,
  paddingLeft: vars.ref.spacing["1-5"],
  paddingRight: vars.ref.spacing["1-5"],
  paddingTop: vars.ref.spacing["0-5"],
  paddingBottom: vars.ref.spacing["0-5"],
  fontFamily: vars.system.textStyles.code.fontFamily,
    fontSize: vars.system.textStyles.code.fontSize,
    fontWeight: vars.system.textStyles.code.fontWeight,
    letterSpacing: vars.system.textStyles.code.letterSpacing,
    lineHeight: vars.system.textStyles.code.lineHeight,
});
