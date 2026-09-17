import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const numberInputGroup = style({
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  width: "100%",
  gap: vars.ref.spacing[8],
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  backgroundColor: vars.system.colors.backgroundCard,
  paddingLeft: vars.ref.spacing[12],
  ":hover": {
    borderColor: vars.system.colors.borderEmphasized,
  },
  ":focus-within": {
    borderColor: vars.system.colors.accent,
    outline: "none", boxShadow: `0 0 0 2px ${vars.system.colors.accent}`,
  },
  selectors: {
    "&[data-invalid]": {
      borderColor: vars.ref.color.danger[500],
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

export const numberInputField = style({
  flex: 1,
  minWidth: 0,
  boxSizing: "border-box",
  border: "none",
  outline: "none",
  background: "none",
  color: vars.system.colors.textPrimary,
  paddingTop: vars.ref.spacing[8],
  paddingBottom: vars.ref.spacing[8],
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
  "::placeholder": {
    color: vars.system.colors.textSecondary,
  },
});

export const numberInputAffix = style({
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
  color: vars.system.colors.textSecondary,
  backgroundColor: vars.system.colors.backgroundBody,
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
});

export const numberInputStepper = style({
  display: "flex",
  flexDirection: "column",
  flexShrink: 0,
  alignSelf: "stretch",
  boxSizing: "border-box",
  borderLeft: vars.system.border.default,
});

export const numberInputStepperButton = style({
  flex: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  width: vars.ref.spacing[24],
  cursor: "pointer",
  border: "none",
  backgroundColor: vars.system.colors.backgroundBody,
  color: vars.system.colors.textSecondary,
  ":hover": {
    backgroundColor: vars.system.colors.backgroundMuted,
  },
  selectors: {
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
});

export const numberInputIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: vars.ref.fontSize.sm,
  height: vars.ref.fontSize.sm,
});

export const numberInputIncrementIcon = style({
  transform: "rotate(180deg)",
});
