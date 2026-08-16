import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const paginationRoot = style({
  display: "flex",
  alignItems: "center",
  boxSizing: "border-box",
  gap: vars.ref.spacing[4],
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
  fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
      fontSize: vars.system.textScale["tiny-caption"].fontSize,
      fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
      letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
      lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
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
      minWidth: vars.ref.spacing[24],
      paddingLeft: vars.ref.spacing[4],
      paddingRight: vars.ref.spacing[4],
      paddingTop: vars.ref.spacing[4],
      paddingBottom: vars.ref.spacing[4],
      fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
      fontSize: vars.system.textScale["tiny-caption"].fontSize,
      fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
      letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
      lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
    },
  "md": {
      minWidth: vars.ref.spacing[32],
      paddingLeft: vars.ref.spacing[8],
      paddingRight: vars.ref.spacing[8],
      paddingTop: vars.ref.spacing[4],
      paddingBottom: vars.ref.spacing[4],
      fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
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
  fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
      fontSize: vars.system.textScale["tiny-caption"].fontSize,
      fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
      letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
      lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
});
