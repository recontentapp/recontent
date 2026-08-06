import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const dateInputRoot = style({
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

export const dateInputField = style({
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
});

export const dateInputIconButton = style({
  display: "inline-flex",
  flexShrink: 0,
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: vars.system.colors.textSecondary,
});

export const dateInputIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: vars.ref.fontSize.base,
  height: vars.ref.fontSize.base,
});

export const dateInputPositioner = style({
  outline: "none",
  zIndex: 50,
  selectors: {
    '&[data-side="top"]': { marginBottom: vars.ref.spacing["0-5"] },
    '&[data-side="bottom"]': { marginTop: vars.ref.spacing["0-5"] },
  },
});

export const dateInputPopup = style({
  boxSizing: "border-box",
  backgroundColor: vars.system.colors.backgroundCard,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  boxShadow: vars.system.elevation.md,
  padding: vars.ref.spacing[3],
  outline: "none",
});

export const dateInputHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: vars.ref.spacing[3],
});

export const dateInputNavButton = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: vars.system.colors.textSecondary,
  selectors: {
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
});

export const dateInputMonthLabel = style({
  fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
  color: vars.system.colors.textPrimary,
});

export const dateInputGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "0.125rem",
});

export const dateInputWeekday = style({
  textAlign: "center",
  color: vars.system.colors.textSecondary,
  fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
});

export const dateInputDay = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  aspectRatio: "1",
  cursor: "pointer",
  border: "1px solid transparent",
  borderRadius: vars.ref.radius.inner,
  color: vars.system.colors.textPrimary,
  backgroundColor: "transparent",
  fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
  ":hover": {
    backgroundColor: vars.system.colors.backgroundBody,
  },
  selectors: {
    "&[data-outside-month]": {
      color: vars.system.colors.textDisabled,
    },
    "&[data-today]": {
      borderColor: vars.system.colors.accent,
    },
    "&[data-selected]": {
      backgroundColor: vars.system.colors.accent,
      color: vars.system.colors.onAccent,
    },
    "&:disabled": {
      color: vars.system.colors.textDisabled,
      cursor: "not-allowed",
    },
  },
});
