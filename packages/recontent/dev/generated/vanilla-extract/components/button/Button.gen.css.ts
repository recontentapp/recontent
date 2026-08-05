import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const buttonRoot = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  borderRadius: vars.ref.radius.element,
  ":focus-visible": {
    outline: `2px solid ${vars.system.colors.accent}`,
    outlineOffset: "2px",
  },
});

export const buttonLoading = style({
  cursor: "wait",
  opacity: 0.7,
});

export const buttonVariant = styleVariants({
  "primary": {
      backgroundColor: vars.system.colors.accent,
      color: vars.system.colors.onAccent,
      border: vars.system.border.default,
      fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
      ":hover": {
        backgroundColor: vars.ref.color.blue500,
        color: vars.system.colors.onAccent,
        border: vars.system.border.default,
      },
      ":disabled": {
        backgroundColor: vars.system.colors.backgroundMuted,
        color: vars.system.colors.textDisabled,
        border: vars.system.border.default,
        cursor: "not-allowed",
      },
    },
  "secondary": {
      backgroundColor: vars.system.colors.backgroundCard,
      color: vars.system.colors.textPrimary,
      border: vars.system.border.default,
      fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
      ":hover": {
        backgroundColor: vars.system.colors.backgroundBody,
        color: vars.system.colors.textPrimary,
        border: vars.system.border.default,
      },
      ":disabled": {
        backgroundColor: vars.system.colors.backgroundMuted,
        color: vars.system.colors.textDisabled,
        border: vars.system.border.default,
        cursor: "not-allowed",
      },
    },
});

export const buttonSize = styleVariants({
  "sm": {
      paddingLeft: vars.ref.spacing[3],
      paddingRight: vars.ref.spacing[3],
      paddingTop: vars.ref.spacing[1],
      paddingBottom: vars.ref.spacing[1],
      gap: vars.ref.spacing[1],
      fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
    },
  "md": {
      paddingLeft: vars.ref.spacing[4],
      paddingRight: vars.ref.spacing[4],
      paddingTop: vars.ref.spacing[2],
      paddingBottom: vars.ref.spacing[2],
      gap: vars.ref.spacing[2],
      fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
    },
});
