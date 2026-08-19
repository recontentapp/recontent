import { keyframes, style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

const fadeIn = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });

export const drawerBackdrop = style({
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

export const drawerPopup = style({
  position: "fixed",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  zIndex: 60,
  gap: vars.ref.spacing[8],
  backgroundColor: vars.system.colors.backgroundSurface,
  border: vars.system.border.default,
  boxShadow: vars.system.elevationScale.md,
  paddingLeft: vars.ref.spacing[24],
  paddingRight: vars.ref.spacing[24],
  paddingTop: vars.ref.spacing[16],
  paddingBottom: vars.ref.spacing[16],
  transitionProperty: "translate, opacity",
  transitionDuration: vars.system.transitionScale.fast.transitionDuration,
  transitionTimingFunction: vars.system.transitionScale.fast.transitionTimingFunction,
  selectors: {
    "&[data-starting-style], &[data-ending-style]": {
      opacity: 0,
    },
  },
});

export const drawerPlacement = styleVariants({
  left: {
    top: 0,
    left: 0,
    bottom: 0,
    height: "100%",
    borderRight: vars.system.border.default,
    borderTopRightRadius: vars.ref.radius.container,
    borderBottomRightRadius: vars.ref.radius.container,
    selectors: {
      "&[data-starting-style], &[data-ending-style]": {
        translate: "-100% 0",
      },
    },
  },
  right: {
    top: 0,
    right: 0,
    bottom: 0,
    height: "100%",
    borderLeft: vars.system.border.default,
    borderTopLeftRadius: vars.ref.radius.container,
    borderBottomLeftRadius: vars.ref.radius.container,
    selectors: {
      "&[data-starting-style], &[data-ending-style]": {
        translate: "100% 0",
      },
    },
  },
  top: {
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    borderBottom: vars.system.border.default,
    borderBottomLeftRadius: vars.ref.radius.container,
    borderBottomRightRadius: vars.ref.radius.container,
    selectors: {
      "&[data-starting-style], &[data-ending-style]": {
        translate: "0 -100%",
      },
    },
  },
  bottom: {
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    borderTop: vars.system.border.default,
    borderTopLeftRadius: vars.ref.radius.container,
    borderTopRightRadius: vars.ref.radius.container,
    selectors: {
      "&[data-starting-style], &[data-ending-style]": {
        translate: "0 100%",
      },
    },
  },
});

export const drawerSizeHorizontal = styleVariants({
  "sm": { width: vars.ref.overlayWidth.sm },
  "md": { width: vars.ref.overlayWidth.md },
  "lg": { width: vars.ref.overlayWidth.lg },
  "full": { width: vars.ref.overlayWidth.fullscreen },
});

export const drawerSizeVertical = styleVariants({
  "sm": { height: vars.ref.overlayWidth.sm },
  "md": { height: vars.ref.overlayWidth.md },
  "lg": { height: vars.ref.overlayWidth.lg },
  "full": { height: vars.ref.overlayWidth.fullscreen },
});

export const drawerHeader = style({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: vars.ref.spacing[8],
});

export const drawerTitle = style({
  margin: 0,
  color: vars.system.colors.textPrimary,
  fontFamily: vars.system.textScale["heading-page-l"].fontFamily,
      fontSize: vars.system.textScale["heading-page-l"].fontSize,
      fontWeight: vars.system.textScale["heading-page-l"].fontWeight,
      letterSpacing: vars.system.textScale["heading-page-l"].letterSpacing,
      lineHeight: vars.system.textScale["heading-page-l"].lineHeight,
});

export const drawerClose = style({
  display: "inline-flex",
  flexShrink: 0,
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: vars.system.colors.textPrimary,
  ":focus-visible": {
    outline: "none",
    boxShadow: `0 0 0 2px ${vars.system.colors.accent}`,
  },
});

export const drawerCloseIcon = style({
  display: "inline-flex",
  width: "1.25em",
  height: "1.25em",
});

export const drawerBody = style({
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
});

export const drawerFooter = style({
  display: "flex",
  justifyContent: "flex-end",
  gap: vars.ref.spacing[8],
  borderTop: vars.system.border.default,
  paddingTop: vars.ref.spacing[16],
});
