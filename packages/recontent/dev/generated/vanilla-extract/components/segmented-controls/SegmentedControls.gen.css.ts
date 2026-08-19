import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const segmentedControlsRoot = style({
  display: "inline-flex",
  boxSizing: "border-box",
  border: vars.system.border.default,
  borderColor: vars.system.colors.border,
  borderRadius: vars.ref.radius.element,
  backgroundColor: vars.system.colors.backgroundBody,
  paddingLeft: vars.ref.spacing[2],
  paddingRight: vars.ref.spacing[2],
  paddingTop: vars.ref.spacing[2],
  paddingBottom: vars.ref.spacing[2],
});

export const segmentedControlsOption = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  border: "none",
  backgroundColor: "transparent",
  color: vars.system.colors.textSecondary,
  borderRadius: vars.ref.radius.inner,
  gap: vars.ref.spacing[4],
  paddingLeft: vars.ref.spacing[12],
  paddingRight: vars.ref.spacing[12],
  paddingTop: vars.ref.spacing[4],
  paddingBottom: vars.ref.spacing[4],
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
  fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
  fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
  letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
  lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
  ":hover": {
    color: vars.system.colors.textPrimary,
  },
  selectors: {
    "&[data-pressed]": {
      color: vars.system.colors.textPrimary,
      backgroundColor: vars.system.colors.backgroundCard,
    },
    "&[data-pressed]:hover": {
      color: vars.system.colors.textPrimary,
    },
    "&[data-disabled]": {
      color: vars.system.colors.textDisabled,
      cursor: "not-allowed",
    },
  },
  ":focus-visible": {
    outline: "none",
    boxShadow: `0 0 0 2px ${vars.system.colors.accent}`,
  },
});

export const segmentedControlsOptionIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: vars.ref.fontSize.base,
  height: vars.ref.fontSize.base,
});
