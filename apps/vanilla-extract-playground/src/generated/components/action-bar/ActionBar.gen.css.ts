import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const actionBarRoot = style({
  position: "fixed",
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  zIndex: 40,
  backgroundColor: vars.system.colors.backgroundSurface,
  color: vars.system.colors.textPrimary,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.container,
  boxShadow: vars.system.elevationScale.md,
  gap: vars.ref.spacing[8],
  paddingLeft: vars.ref.spacing[12],
  paddingRight: vars.ref.spacing[12],
  paddingTop: vars.ref.spacing[8],
  paddingBottom: vars.ref.spacing[8],
  opacity: 1,
  transform: "translateY(0)",
  pointerEvents: "auto",
  transitionProperty: "opacity, transform",
  transitionDuration: "200ms",
  transitionTimingFunction: "ease",
});

/**
 * Stays in the DOM (not `display: none`) so opacity/transform can actually
 * transition — a display toggle can't be animated with plain CSS transitions.
 */
export const actionBarHidden = style({
  opacity: 0,
  transform: "translateY(0.5rem)",
  pointerEvents: "none",
});

export const actionBarPlacement = styleVariants({
  "bottom-start": {
    bottom: vars.ref.spacing[24],
    left: vars.ref.spacing[24],
  },
  bottom: {
    bottom: vars.ref.spacing[24],
    left: "50%",
    translate: "-50% 0",
  },
  "bottom-end": {
    bottom: vars.ref.spacing[24],
    right: vars.ref.spacing[24],
  },
});
