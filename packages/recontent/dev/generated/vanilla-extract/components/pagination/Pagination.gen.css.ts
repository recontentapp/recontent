import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const paginationRoot = style({
  display: "flex",
  alignItems: "center",
  boxSizing: "border-box",
  gap: vars.ref.spacing[1],
});

export const paginationButton = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.inner,
  color: vars.system.colors.textSecondary,
  backgroundColor: vars.system.colors.backgroundCard,
  fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
  ":hover": {
    color: vars.system.colors.textPrimary,
    backgroundColor: vars.system.colors.backgroundBody,
  },
  selectors: {
    "&[data-active]": {
      color: vars.system.colors.onAccent,
      backgroundColor: vars.system.colors.accent,
    },
    "&:disabled": {
      color: vars.system.colors.textDisabled,
      cursor: "not-allowed",
    },
  },
});

export const paginationButtonSize = styleVariants({
  "sm": {
      minWidth: vars.ref.spacing[6],
      paddingLeft: vars.ref.spacing[1],
      paddingRight: vars.ref.spacing[1],
      paddingTop: vars.ref.spacing[1],
      paddingBottom: vars.ref.spacing[1],
      fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
    },
  "md": {
      minWidth: vars.ref.spacing[8],
      paddingLeft: vars.ref.spacing[2],
      paddingRight: vars.ref.spacing[2],
      paddingTop: vars.ref.spacing[1],
      paddingBottom: vars.ref.spacing[1],
      fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
    },
});

export const paginationIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: vars.ref.fontSize.sm,
  height: vars.ref.fontSize.sm,
});

export const paginationEllipsis = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  color: vars.system.colors.textDisabled,
  fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
});
