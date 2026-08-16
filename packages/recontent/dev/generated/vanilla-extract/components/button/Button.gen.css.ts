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
      fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
      ":hover": {
        backgroundColor: vars.ref.color.primary[800],
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
      fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
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
      paddingLeft: vars.ref.spacing[12],
      paddingRight: vars.ref.spacing[12],
      paddingTop: vars.ref.spacing[4],
      paddingBottom: vars.ref.spacing[4],
      gap: vars.ref.spacing[4],
      fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
    },
  "md": {
      paddingLeft: vars.ref.spacing[16],
      paddingRight: vars.ref.spacing[16],
      paddingTop: vars.ref.spacing[8],
      paddingBottom: vars.ref.spacing[8],
      gap: vars.ref.spacing[8],
      fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
    },
});
