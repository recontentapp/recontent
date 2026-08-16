import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const fieldRoot = style({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  gap: vars.ref.spacing[4],
});

export const fieldLabelRow = style({
  display: "flex",
  alignItems: "center",
  gap: "0.25em",
});

export const fieldLabel = style({
  color: vars.system.colors.textPrimary,
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
});

export const fieldRequiredIndicator = style({
  color: vars.ref.color.danger[500],
});

export const fieldOptionalText = style({
  color: vars.system.colors.textSecondary,
  fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
      fontSize: vars.system.textScale["tiny-caption"].fontSize,
      fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
      letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
      lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
});

export const fieldDescription = style({
  margin: 0,
  color: vars.system.colors.textSecondary,
  fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
      fontSize: vars.system.textScale["tiny-caption"].fontSize,
      fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
      letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
      lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
});

export const fieldErrorRow = style({
  display: "flex",
  alignItems: "center",
  gap: "0.25em",
  color: vars.ref.color.danger[500],
  fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
      fontSize: vars.system.textScale["tiny-caption"].fontSize,
      fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
      letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
      lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
});

export const fieldErrorIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: vars.ref.fontSize.sm,
  height: vars.ref.fontSize.sm,
});
