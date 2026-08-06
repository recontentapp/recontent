import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const toastViewport = style({
  position: "fixed",
  display: "flex",
  flexDirection: "column",
  gap: vars.ref.spacing[2],
  zIndex: 80,
  outline: "none",
});

export const toastViewportPlacement = styleVariants({
  "top-left": { top: vars.ref.spacing[4], left: vars.ref.spacing[4] },
  "top-right": { top: vars.ref.spacing[4], right: vars.ref.spacing[4] },
  "bottom-left": { bottom: vars.ref.spacing[4], left: vars.ref.spacing[4] },
  "bottom-right": { bottom: vars.ref.spacing[4], right: vars.ref.spacing[4] },
});

export const toastRoot = style({
  boxSizing: "border-box",
  display: "flex",
  alignItems: "flex-start",
  width: vars.ref.overlayWidth.sm,
  gap: vars.ref.spacing[2],
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  backgroundColor: vars.system.colors.backgroundSurface,
  boxShadow: vars.system.elevation.md,
  paddingLeft: vars.ref.spacing[4],
  paddingRight: vars.ref.spacing[4],
  paddingTop: vars.ref.spacing[3],
  paddingBottom: vars.ref.spacing[3],
  transitionProperty: "opacity, transform",
  transitionDuration: vars.system.motion.fast,
  selectors: {
    "&[data-starting-style], &[data-ending-style]": {
      opacity: 0,
    },
  },
});

export const toastRootStatus = styleVariants({
  "info": {
      color: vars.system.colors.textPrimary,
      backgroundColor: vars.system.colors.backgroundSurface,
      borderColor: vars.system.colors.accent,
    },
  "success": {
      color: vars.system.colors.textPrimary,
      backgroundColor: vars.system.colors.backgroundSurface,
      borderColor: vars.ref.color.success,
    },
  "warning": {
      color: vars.system.colors.textPrimary,
      backgroundColor: vars.system.colors.backgroundSurface,
      borderColor: vars.ref.color.warning,
    },
  "danger": {
      color: vars.system.colors.textPrimary,
      backgroundColor: vars.system.colors.backgroundSurface,
      borderColor: vars.ref.color.error,
    },
});

export const toastIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: vars.ref.fontSize.lg,
  height: vars.ref.fontSize.lg,
});

export const toastIconStatus = styleVariants({
  "info": { color: vars.system.colors.accent },
  "success": { color: vars.ref.color.success },
  "warning": { color: vars.ref.color.warning },
  "danger": { color: vars.ref.color.error },
});

export const toastContent = style({
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: vars.ref.spacing[2],
});

export const toastTitle = style({
  margin: 0,
  fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
});

export const toastTitleStatus = styleVariants({
  "info": { color: vars.system.colors.textPrimary },
  "success": { color: vars.system.colors.textPrimary },
  "warning": { color: vars.system.colors.textPrimary },
  "danger": { color: vars.system.colors.textPrimary },
});

export const toastDescription = style({
  margin: 0,
  color: vars.system.colors.textSecondary,
  fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
});

export const toastActions = style({
  display: "flex",
  alignItems: "center",
  flexShrink: 0,
  gap: vars.ref.spacing[2],
});

export const toastActionButton = style({
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: "inherit",
  textDecoration: "underline",
});

export const toastClose = style({
  display: "inline-flex",
  flexShrink: 0,
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: "inherit",
});
