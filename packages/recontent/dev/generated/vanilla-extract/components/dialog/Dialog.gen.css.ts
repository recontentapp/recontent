import { keyframes, style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

const fadeIn = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
const zoomIn = keyframes({
  from: { opacity: 0, transform: "scale(0.96)" },
  to: { opacity: 1, transform: "scale(1)" },
});

export const dialogBackdrop = style({
  position: "fixed",
  inset: 0,
  backgroundColor: vars.ref.color.secondary[900],
  zIndex: 60,
  selectors: {
    "&[data-starting-style], &[data-ending-style]": {
      opacity: 0,
    },
  },
  animationName: fadeIn,
  animationDuration: vars.system.transitionScale.fast.transitionDuration,
  animationTimingFunction: vars.system.transitionScale.fast.transitionTimingFunction,
});

export const dialogPopup = style({
  position: "fixed",
  top: "50%",
  left: "50%",
  translate: "-50% -50%",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  width: "calc(100% - 2rem)",
  maxHeight: "calc(100vh - 2rem)",
  overflowY: "auto",
  zIndex: 60,
  gap: vars.ref.spacing[8],
  backgroundColor: vars.system.colors.backgroundSurface,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.container,
  boxShadow: vars.system.elevationScale.md,
  paddingLeft: vars.ref.spacing[24],
  paddingRight: vars.ref.spacing[24],
  paddingTop: vars.ref.spacing[16],
  paddingBottom: vars.ref.spacing[16],
  selectors: {
    "&[data-starting-style], &[data-ending-style]": {
      opacity: 0,
      transform: "scale(0.96)",
    },
  },
  animationName: zoomIn,
  animationDuration: vars.system.transitionScale.fast.transitionDuration,
  animationTimingFunction: vars.system.transitionScale.fast.transitionTimingFunction,
});

export const dialogPopupSize = styleVariants({
  "sm": { maxWidth: vars.ref.overlayWidth.sm },
  "md": { maxWidth: vars.ref.overlayWidth.md },
  "lg": { maxWidth: vars.ref.overlayWidth.lg },
  "fullscreen": { maxWidth: vars.ref.overlayWidth.fullscreen },
});

export const dialogHeader = style({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: vars.ref.spacing[8],
});

export const dialogHeaderText = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.ref.spacing[8],
  minWidth: 0,
});

export const dialogTitle = style({
  margin: 0,
  color: vars.system.colors.textPrimary,
  fontFamily: vars.system.textScale["heading-page-l"].fontFamily,
      fontSize: vars.system.textScale["heading-page-l"].fontSize,
      fontWeight: vars.system.textScale["heading-page-l"].fontWeight,
      letterSpacing: vars.system.textScale["heading-page-l"].letterSpacing,
      lineHeight: vars.system.textScale["heading-page-l"].lineHeight,
});

export const dialogDescription = style({
  margin: 0,
  color: vars.system.colors.textSecondary,
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
});

export const dialogClose = style({
  display: "inline-flex",
  flexShrink: 0,
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: vars.system.colors.textPrimary,
});

export const dialogCloseIcon = style({
  display: "inline-flex",
  width: "1.25em",
  height: "1.25em",
});

export const dialogBody = style({
  flex: 1,
  minHeight: 0,
});

export const dialogFooter = style({
  display: "flex",
  justifyContent: "flex-end",
  gap: vars.ref.spacing[8],
  borderTop: vars.system.border.default,
  paddingTop: vars.ref.spacing[16],
});
