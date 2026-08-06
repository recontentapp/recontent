import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const textInputRoot = style({
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  width: "100%",
  gap: vars.ref.spacing[2],
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  backgroundColor: vars.system.colors.backgroundCard,
  paddingLeft: vars.ref.spacing[3],
  paddingRight: vars.ref.spacing[3],
  ":hover": {
    borderColor: vars.system.colors.borderEmphasized,
  },
  ":focus-within": {
    borderColor: vars.system.colors.accent,
    outline: `2px solid ${vars.system.colors.accent}`,
    outlineOffset: "2px",
  },
  selectors: {
    "&[data-invalid]": {
      borderColor: vars.ref.color.error,
    },
    "&[data-readonly]": {
      backgroundColor: vars.system.colors.backgroundBody,
    },
    "&[data-disabled]": {
      backgroundColor: vars.system.colors.backgroundMuted,
      color: vars.system.colors.textDisabled,
      cursor: "not-allowed",
    },
  },
});

export const textInputField = style({
  flex: 1,
  minWidth: 0,
  boxSizing: "border-box",
  border: "none",
  outline: "none",
  background: "none",
  color: vars.system.colors.textPrimary,
  paddingTop: vars.ref.spacing[2],
  paddingBottom: vars.ref.spacing[2],
  fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
  "::placeholder": {
    color: vars.system.colors.textSecondary,
  },
  selectors: {
    "&:disabled": {
      color: vars.system.colors.textDisabled,
      cursor: "not-allowed",
    },
  },
});

export const textInputIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  color: vars.system.colors.textSecondary,
  width: vars.ref.fontSize.base,
  height: vars.ref.fontSize.base,
});

export const textInputAffix = style({
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
  boxSizing: "border-box",
  height: "100%",
  color: vars.system.colors.textSecondary,
  backgroundColor: vars.system.colors.backgroundBody,
  fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
});

export const textInputClear = style({
  display: "inline-flex",
  flexShrink: 0,
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: vars.system.colors.textSecondary,
});
