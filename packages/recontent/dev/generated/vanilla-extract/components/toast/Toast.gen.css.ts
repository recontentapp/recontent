import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const toastViewport = style({
  position: "fixed",
  display: "flex",
  flexDirection: "column",
  gap: vars.ref.spacing[8],
  zIndex: 80,
  outline: "none",
});

export const toastViewportPlacement = styleVariants({
  "top-left": { top: vars.ref.spacing[16], left: vars.ref.spacing[16] },
  "top-right": { top: vars.ref.spacing[16], right: vars.ref.spacing[16] },
  "bottom-left": { bottom: vars.ref.spacing[16], left: vars.ref.spacing[16] },
  "bottom-right": { bottom: vars.ref.spacing[16], right: vars.ref.spacing[16] },
});

export const toastRoot = style({
  boxSizing: "border-box",
  display: "flex",
  alignItems: "flex-start",
  width: vars.ref.overlayWidth.sm,
  gap: vars.ref.spacing[8],
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  backgroundColor: vars.system.colors.backgroundSurface,
  boxShadow: vars.system.elevationScale.md,
  paddingLeft: vars.ref.spacing[16],
  paddingRight: vars.ref.spacing[16],
  paddingTop: vars.ref.spacing[12],
  paddingBottom: vars.ref.spacing[12],
  transitionProperty: "opacity, transform",
  transitionDuration: vars.system.transitionScale.fast.transitionDuration,
  transitionTimingFunction: vars.system.transitionScale.fast.transitionTimingFunction,
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
      borderColor: vars.ref.color.success[500],
    },
  "warning": {
      color: vars.system.colors.textPrimary,
      backgroundColor: vars.system.colors.backgroundSurface,
      borderColor: vars.ref.color.warning[500],
    },
  "danger": {
      color: vars.system.colors.textPrimary,
      backgroundColor: vars.system.colors.backgroundSurface,
      borderColor: vars.ref.color.danger[500],
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
  "success": { color: vars.ref.color.success[500] },
  "warning": { color: vars.ref.color.warning[500] },
  "danger": { color: vars.ref.color.danger[500] },
});

export const toastContent = style({
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: vars.ref.spacing[8],
});

export const toastTitle = style({
  margin: 0,
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
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
  fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
      fontSize: vars.system.textScale["tiny-caption"].fontSize,
      fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
      letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
      lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
});

export const toastActions = style({
  display: "flex",
  alignItems: "center",
  flexShrink: 0,
  gap: vars.ref.spacing[8],
});

export const toastActionButton = style({
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: "inherit",
  textDecoration: "underline",
  ":focus-visible": {
    outline: "none",
    boxShadow: `0 0 0 2px ${vars.system.colors.accent}`,
  },
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
  ":focus-visible": {
    outline: "none",
    boxShadow: `0 0 0 2px ${vars.system.colors.accent}`,
  },
});
