import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const popoverBackdrop = style({
  position: "fixed",
  inset: 0,
  backgroundColor: vars.ref.color.secondary[900],
  zIndex: 55,
  selectors: {
    "&[data-starting-style], &[data-ending-style]": {
      opacity: 0,
    },
  },
  transitionProperty: "opacity",
  transitionDuration: vars.system.transitionScale.fast.transitionDuration,
  transitionTimingFunction: vars.system.transitionScale.fast.transitionTimingFunction,
});

export const popoverPositioner = style({
  outline: "none",
  zIndex: 55,
  selectors: {
    '&[data-side="top"]': { marginBottom: vars.ref.spacing[4] },
    '&[data-side="bottom"]': { marginTop: vars.ref.spacing[4] },
    '&[data-side="left"]': { marginRight: vars.ref.spacing[4] },
    '&[data-side="right"]': { marginLeft: vars.ref.spacing[4] },
  },
});

export const popoverPopup = style({
  boxSizing: "border-box",
  maxWidth: vars.ref.overlayWidth.sm,
  color: vars.system.colors.textPrimary,
  backgroundColor: vars.system.colors.backgroundSurface,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  boxShadow: vars.system.elevationScale.md,
  paddingLeft: vars.ref.spacing[16],
  paddingRight: vars.ref.spacing[16],
  paddingTop: vars.ref.spacing[12],
  paddingBottom: vars.ref.spacing[12],
  outline: "none",
  transitionProperty: "opacity, transform",
  transitionDuration: vars.system.transitionScale.fast.transitionDuration,
  transitionTimingFunction: vars.system.transitionScale.fast.transitionTimingFunction,
  selectors: {
    "&[data-starting-style], &[data-ending-style]": {
      opacity: 0,
    },
  },
});

export const popoverArrow = style({
  width: vars.ref.spacing[8],
  height: vars.ref.spacing[8],
  selectors: {
    '&[data-side="top"]': { bottom: `calc(vars.ref.spacing[8] / -2)` },
    '&[data-side="bottom"]': { top: `calc(vars.ref.spacing[8] / -2)` },
    '&[data-side="left"]': { right: `calc(vars.ref.spacing[8] / -2)` },
    '&[data-side="right"]': { left: `calc(vars.ref.spacing[8] / -2)` },
  },
});

export const popoverArrowShape = style({
  width: "100%",
  height: "100%",
  backgroundColor: vars.system.colors.backgroundSurface,
  transform: "rotate(45deg)",
  borderRadius: "2px",
});
