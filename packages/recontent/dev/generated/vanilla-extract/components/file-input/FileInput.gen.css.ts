import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const fileInputRoot = style({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  gap: vars.ref.spacing[2],
});

export const fileInputDropzone = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  width: "100%",
  cursor: "pointer",
  textAlign: "center",
  gap: vars.ref.spacing[2],
  color: vars.system.colors.textSecondary,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  backgroundColor: vars.system.colors.backgroundBody,
  paddingLeft: vars.ref.spacing[4],
  paddingRight: vars.ref.spacing[4],
  paddingTop: vars.ref.spacing[3],
  paddingBottom: vars.ref.spacing[3],
  fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
  ":hover": {
    borderColor: vars.system.colors.borderEmphasized,
  },
  selectors: {
    "&[data-dragging]": {
      borderColor: vars.system.colors.accent,
      backgroundColor: vars.system.colors.backgroundMuted,
    },
    "&[data-invalid]": {
      borderColor: vars.ref.color.error,
    },
    "&[data-disabled]": {
      backgroundColor: vars.system.colors.backgroundMuted,
      color: vars.system.colors.textDisabled,
      cursor: "not-allowed",
    },
  },
});

export const fileInputButton = style({
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  gap: vars.ref.spacing[2],
  color: vars.system.colors.textSecondary,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  backgroundColor: vars.system.colors.backgroundBody,
  paddingLeft: vars.ref.spacing[4],
  paddingRight: vars.ref.spacing[4],
  paddingTop: vars.ref.spacing[3],
  paddingBottom: vars.ref.spacing[3],
  fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
  ":hover": {
    borderColor: vars.system.colors.borderEmphasized,
  },
  selectors: {
    "&[data-invalid]": {
      borderColor: vars.ref.color.error,
    },
    "&[data-disabled]": {
      backgroundColor: vars.system.colors.backgroundMuted,
      color: vars.system.colors.textDisabled,
      cursor: "not-allowed",
    },
  },
});

export const fileInputIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: vars.ref.fontSize.lg,
  height: vars.ref.fontSize.lg,
});

export const fileInputHidden = style({
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
});

export const fileInputList = style({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  gap: vars.ref.spacing[2],
});

export const fileInputFile = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxSizing: "border-box",
  gap: vars.ref.spacing[2],
  color: vars.system.colors.textPrimary,
  borderRadius: vars.ref.radius.inner,
  paddingLeft: vars.ref.spacing[4],
  paddingRight: vars.ref.spacing[4],
  paddingTop: vars.ref.spacing[3],
  paddingBottom: vars.ref.spacing[3],
  fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
});

export const fileInputFileName = style({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const fileInputRemove = style({
  display: "inline-flex",
  flexShrink: 0,
  alignItems: "center",
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: "inherit",
});
