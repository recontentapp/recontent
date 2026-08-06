import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const fieldRoot = style({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  gap: vars.ref.spacing[1],
});

export const fieldLabelRow = style({
  display: "flex",
  alignItems: "center",
  gap: "0.25em",
});

export const fieldLabel = style({
  color: vars.system.colors.textPrimary,
  fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
});

export const fieldRequiredIndicator = style({
  color: vars.ref.color.error,
});

export const fieldOptionalText = style({
  color: vars.system.colors.textSecondary,
  fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
});

export const fieldDescription = style({
  margin: 0,
  color: vars.system.colors.textSecondary,
  fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
});

export const fieldErrorRow = style({
  display: "flex",
  alignItems: "center",
  gap: "0.25em",
  color: vars.ref.color.error,
  fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
});

export const fieldErrorIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: vars.ref.fontSize.sm,
  height: vars.ref.fontSize.sm,
});
