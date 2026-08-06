import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const textareaRoot = style({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  width: "100%",
  gap: vars.ref.spacing[1],
});

export const textareaField = style({
  boxSizing: "border-box",
  width: "100%",
  resize: "vertical",
  color: vars.system.colors.textPrimary,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  backgroundColor: vars.system.colors.backgroundCard,
  paddingLeft: vars.ref.spacing[3],
  paddingRight: vars.ref.spacing[3],
  paddingTop: vars.ref.spacing[2],
  paddingBottom: vars.ref.spacing[2],
  fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
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
      borderColor: vars.ref.color.error,
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
  fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
  selectors: {
    "&[data-exceeded]": {
      color: vars.ref.color.error,
    },
  },
});

