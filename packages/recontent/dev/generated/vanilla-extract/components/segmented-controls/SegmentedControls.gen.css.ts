import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const segmentedControlsRoot = style({
  display: "inline-flex",
  boxSizing: "border-box",
  border: vars.system.border.default,
  borderColor: vars.system.colors.border,
  borderRadius: vars.ref.radius.element,
  backgroundColor: vars.system.colors.backgroundBody,
  paddingLeft: vars.ref.spacing["0-5"],
  paddingRight: vars.ref.spacing["0-5"],
  paddingTop: vars.ref.spacing["0-5"],
  paddingBottom: vars.ref.spacing["0-5"],
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
  gap: vars.ref.spacing[1],
  paddingLeft: vars.ref.spacing[3],
  paddingRight: vars.ref.spacing[3],
  paddingTop: vars.ref.spacing[1],
  paddingBottom: vars.ref.spacing[1],
  fontFamily: vars.system.textStyles.body.fontFamily,
  fontSize: vars.system.textStyles.body.fontSize,
  fontWeight: vars.system.textStyles.body.fontWeight,
  letterSpacing: vars.system.textStyles.body.letterSpacing,
  lineHeight: vars.system.textStyles.body.lineHeight,
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
});

export const segmentedControlsOptionIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: vars.ref.fontSize.base,
  height: vars.ref.fontSize.base,
});
