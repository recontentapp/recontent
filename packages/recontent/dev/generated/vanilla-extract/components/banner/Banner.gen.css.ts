import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const bannerRoot = style({
  display: "flex",
  alignItems: "flex-start",
  boxSizing: "border-box",
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  gap: vars.ref.spacing[8],
  paddingLeft: vars.ref.spacing[16],
  paddingRight: vars.ref.spacing[16],
  paddingTop: vars.ref.spacing[12],
  paddingBottom: vars.ref.spacing[12],
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
});

export const bannerStatus = styleVariants({
  "info": {
      color: vars.system.colors.textPrimary,
      backgroundColor: vars.system.colors.backgroundMuted,
      borderColor: vars.system.colors.accent,
    },
  "success": {
      color: vars.system.colors.textPrimary,
      backgroundColor: vars.system.colors.backgroundMuted,
      borderColor: vars.ref.color.success[500],
    },
  "warning": {
      color: vars.system.colors.textPrimary,
      backgroundColor: vars.system.colors.backgroundMuted,
      borderColor: vars.ref.color.warning[500],
    },
  "danger": {
      color: vars.system.colors.textPrimary,
      backgroundColor: vars.system.colors.backgroundMuted,
      borderColor: vars.ref.color.danger[500],
    },
});

export const bannerIcon = style({
  flexShrink: 0,
  width: vars.ref.fontSize.lg,
  height: vars.ref.fontSize.lg,
});

export const bannerStatusIconColor = styleVariants({
  "info": { color: vars.system.colors.accent },
  "success": { color: vars.ref.color.success[500] },
  "warning": { color: vars.ref.color.warning[500] },
  "danger": { color: vars.ref.color.danger[500] },
});

export const bannerContent = style({
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: vars.ref.spacing[8],
});

export const bannerTitle = style({
  margin: 0,
  fontFamily: vars.system.textScale["heading-page-l"].fontFamily,
      fontSize: vars.system.textScale["heading-page-l"].fontSize,
      fontWeight: vars.system.textScale["heading-page-l"].fontWeight,
      letterSpacing: vars.system.textScale["heading-page-l"].letterSpacing,
      lineHeight: vars.system.textScale["heading-page-l"].lineHeight,
});

export const bannerStatusTitleColor = styleVariants({
  "info": { color: vars.system.colors.textPrimary },
  "success": { color: vars.system.colors.textPrimary },
  "warning": { color: vars.system.colors.textPrimary },
  "danger": { color: vars.system.colors.textPrimary },
});

export const bannerActions = style({
  display: "flex",
  alignItems: "center",
  flexShrink: 0,
  gap: vars.ref.spacing[8],
});

export const bannerDismiss = style({
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: "inherit",
  ":focus-visible": {
    outline: "none",
    boxShadow: `0 0 0 2px ${vars.system.colors.accent}`,
  },
});
