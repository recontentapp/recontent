import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const toggleRoot = style({
  display: "inline-flex",
  boxSizing: "border-box",
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  backgroundColor: vars.system.colors.backgroundBody,
});

export const toggleOption = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  border: "none",
  backgroundColor: "transparent",
  color: vars.system.colors.textSecondary,
  borderRadius: vars.ref.radius.inner,
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

export const toggleOptionSize = styleVariants({
  "md": {
      paddingLeft: vars.ref.spacing[16],
      paddingRight: vars.ref.spacing[16],
      paddingTop: vars.ref.spacing[4],
      paddingBottom: vars.ref.spacing[4],
      fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
    },
});
