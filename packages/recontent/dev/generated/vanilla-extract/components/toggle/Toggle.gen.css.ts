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

export const toggleOptionSize = styleVariants({
  "sm": {
      paddingLeft: vars.ref.spacing[3],
      paddingRight: vars.ref.spacing[3],
      paddingTop: vars.ref.spacing["0-5"],
      paddingBottom: vars.ref.spacing["0-5"],
      fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
    },
  "md": {
      paddingLeft: vars.ref.spacing[4],
      paddingRight: vars.ref.spacing[4],
      paddingTop: vars.ref.spacing[1],
      paddingBottom: vars.ref.spacing[1],
      fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
    },
});
