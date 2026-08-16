import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const textareaRoot = style({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  width: "100%",
  gap: vars.ref.spacing[4],
});

export const textareaField = style({
  boxSizing: "border-box",
  width: "100%",
  resize: "vertical",
  color: vars.system.colors.textPrimary,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  backgroundColor: vars.system.colors.backgroundCard,
  paddingLeft: vars.ref.spacing[12],
  paddingRight: vars.ref.spacing[12],
  paddingTop: vars.ref.spacing[8],
  paddingBottom: vars.ref.spacing[8],
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
  accentColor: vars.system.colors.borderEmphasized,
  "::placeholder": {
    color: vars.system.colors.textSecondary,
  },
  ":hover": {
    borderColor: vars.system.colors.borderEmphasized,
  },
  ":focus": {
    borderColor: vars.system.colors.accent,
    outline: `2px solid ${vars.system.colors.accent}`,
    outlineOffset: "2px",
  },
  selectors: {
    "&[data-auto-resize]": {
      resize: "none",
    },
    "&[data-invalid]": {
      borderColor: vars.ref.color.danger[500],
    },
    "&[readonly]": {
      backgroundColor: vars.system.colors.backgroundBody,
    },
    "&:disabled": {
      backgroundColor: vars.system.colors.backgroundMuted,
      color: vars.system.colors.textDisabled,
      cursor: "not-allowed",
    },
  },
});

export const textareaCounter = style({
  alignSelf: "flex-end",
  boxSizing: "border-box",
  color: vars.system.colors.textSecondary,
  fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
      fontSize: vars.system.textScale["tiny-caption"].fontSize,
      fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
      letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
      lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
  selectors: {
    "&[data-exceeded]": {
      color: vars.ref.color.danger[500],
    },
  },
});

