import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const dropdownButtonTrigger = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  borderRadius: vars.ref.radius.element,
  ":focus-visible": {
    outline: "2px solid currentColor",
    outlineOffset: "2px",
  },
});

export const dropdownButtonIndicator = style({
  display: "inline-flex",
  flexShrink: 0,
  width: "1em",
  height: "1em",
  selectors: {
    "[data-popup-open] &": { transform: "rotate(180deg)" },
  },
});

export const dropdownButtonVariant = styleVariants({
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

export const dropdownButtonSize = styleVariants({
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

export const dropdownButtonPositioner = style({
  outline: "none",
  zIndex: 50,
  selectors: {
    '&[data-side="top"]': { marginBottom: vars.ref.spacing["0-5"] },
    '&[data-side="bottom"]': { marginTop: vars.ref.spacing["0-5"] },
    '&[data-side="left"]': { marginRight: vars.ref.spacing["0-5"] },
    '&[data-side="right"]': { marginLeft: vars.ref.spacing["0-5"] },
  },
});

export const dropdownButtonPopup = style({
  boxSizing: "border-box",
  backgroundColor: vars.system.colors.backgroundCard,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  boxShadow: vars.system.elevation.md,
  padding: vars.ref.spacing[1],
  outline: "none",
});

export const dropdownButtonItem = style({
  display: "flex",
  alignItems: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  color: vars.system.colors.textPrimary,
  gap: "0.5em",
  paddingLeft: vars.ref.spacing[2],
  paddingRight: vars.ref.spacing[2],
  paddingTop: vars.ref.spacing["1-5"],
  paddingBottom: vars.ref.spacing["1-5"],
  fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
  ":hover": {
    backgroundColor: vars.system.colors.backgroundBody,
  },
  selectors: {
    "&[data-highlighted]": {
      backgroundColor: vars.system.colors.backgroundBody,
    },
    "&[data-disabled]": {
      color: vars.system.colors.textDisabled,
      cursor: "not-allowed",
    },
  },
});

export const dropdownButtonItemIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: vars.ref.fontSize.base,
  height: vars.ref.fontSize.base,
});
