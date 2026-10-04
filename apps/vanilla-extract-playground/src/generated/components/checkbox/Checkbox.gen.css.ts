import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const checkboxRoot = style({
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  gap: vars.ref.spacing[8],
  selectors: {
    "&[data-disabled]": {
      cursor: "not-allowed",
    },
  },
});

export const checkboxBox = style({
  boxSizing: "border-box",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  overflow: "hidden",
  width: vars.ref.iconScale.lg,
  height: vars.ref.iconScale.lg,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.inner,
  backgroundColor: vars.system.colors.backgroundCard,
  ":hover": {
    borderColor: vars.system.colors.borderEmphasized,
  },
  ":focus-visible": {
    outline: "none",
    boxShadow: `0 0 0 2px ${vars.system.colors.accent}`,
  },
  selectors: {
    "&[data-checked], &[data-indeterminate]": {
      backgroundColor: vars.system.colors.accent,
    },
    "&[data-invalid]": {
      borderColor: vars.ref.color.danger[500],
    },
    "&[data-disabled]": {
      backgroundColor: vars.system.colors.backgroundMuted,
      cursor: "not-allowed",
    },
  },
});

export const checkboxIndicator = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  color: vars.system.colors.onAccent,
  selectors: {
    "[data-disabled] &": {
      color: vars.system.colors.textDisabled,
    },
  },
});

export const checkboxIndicatorIcon = style({
  width: "100%",
  height: "100%",
});

export const checkboxLabel = style({
  color: vars.system.colors.textPrimary,
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
});
