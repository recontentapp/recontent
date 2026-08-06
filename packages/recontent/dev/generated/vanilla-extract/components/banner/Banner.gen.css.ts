import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const bannerRoot = style({
  display: "flex",
  alignItems: "flex-start",
  boxSizing: "border-box",
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  gap: vars.ref.spacing[2],
  paddingLeft: vars.ref.spacing[4],
  paddingRight: vars.ref.spacing[4],
  paddingTop: vars.ref.spacing[3],
  paddingBottom: vars.ref.spacing[3],
  fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
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
      borderColor: vars.ref.color.success,
    },
  "warning": {
      color: vars.system.colors.textPrimary,
      backgroundColor: vars.system.colors.backgroundMuted,
      borderColor: vars.ref.color.warning,
    },
  "danger": {
      color: vars.system.colors.textPrimary,
      backgroundColor: vars.system.colors.backgroundMuted,
      borderColor: vars.ref.color.error,
    },
});

export const bannerIcon = style({
  flexShrink: 0,
  width: vars.ref.fontSize.lg,
  height: vars.ref.fontSize.lg,
});

export const bannerStatusIconColor = styleVariants({
  "info": { color: vars.system.colors.accent },
  "success": { color: vars.ref.color.success },
  "warning": { color: vars.ref.color.warning },
  "danger": { color: vars.ref.color.error },
});

export const bannerContent = style({
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: vars.ref.spacing[2],
});

export const bannerTitle = style({
  margin: 0,
  fontFamily: vars.system.textScale.heading3.fontFamily,
      fontSize: vars.system.textScale.heading3.fontSize,
      fontWeight: vars.system.textScale.heading3.fontWeight,
      letterSpacing: vars.system.textScale.heading3.letterSpacing,
      lineHeight: vars.system.textScale.heading3.lineHeight,
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
  gap: vars.ref.spacing[2],
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
});
