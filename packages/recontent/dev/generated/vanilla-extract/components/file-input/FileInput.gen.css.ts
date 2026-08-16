import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const fileInputRoot = style({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  gap: vars.ref.spacing[8],
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
  gap: vars.ref.spacing[8],
  color: vars.system.colors.textSecondary,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  backgroundColor: vars.system.colors.backgroundBody,
  paddingLeft: vars.ref.spacing[16],
  paddingRight: vars.ref.spacing[16],
  paddingTop: vars.ref.spacing[12],
  paddingBottom: vars.ref.spacing[12],
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
  ":hover": {
    borderColor: vars.system.colors.borderEmphasized,
  },
  selectors: {
    "&[data-dragging]": {
      borderColor: vars.system.colors.accent,
      backgroundColor: vars.system.colors.backgroundMuted,
    },
    "&[data-invalid]": {
      borderColor: vars.ref.color.danger[500],
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
  gap: vars.ref.spacing[8],
  color: vars.system.colors.textSecondary,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  backgroundColor: vars.system.colors.backgroundBody,
  paddingLeft: vars.ref.spacing[16],
  paddingRight: vars.ref.spacing[16],
  paddingTop: vars.ref.spacing[12],
  paddingBottom: vars.ref.spacing[12],
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
  ":hover": {
    borderColor: vars.system.colors.borderEmphasized,
  },
  selectors: {
    "&[data-invalid]": {
      borderColor: vars.ref.color.danger[500],
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
  gap: vars.ref.spacing[8],
});

export const fileInputFile = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxSizing: "border-box",
  gap: vars.ref.spacing[8],
  color: vars.system.colors.textPrimary,
  borderRadius: vars.ref.radius.inner,
  paddingLeft: vars.ref.spacing[16],
  paddingRight: vars.ref.spacing[16],
  paddingTop: vars.ref.spacing[12],
  paddingBottom: vars.ref.spacing[12],
  fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
      fontSize: vars.system.textScale["tiny-caption"].fontSize,
      fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
      letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
      lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
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
