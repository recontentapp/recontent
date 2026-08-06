import { keyframes, style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

const indeterminateSweep = keyframes({
  "0%": { transform: "translateX(-100%)" },
  "100%": { transform: "translateX(300%)" },
});

export const progressBarRoot = style({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  gap: vars.ref.spacing[1],
});

export const progressBarLabelRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.ref.spacing[1],
  fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
});

export const progressBarLabelStatus = styleVariants({
  "default": { color: vars.system.colors.textSecondary },
  "success": { color: vars.system.colors.textSecondary },
  "danger": { color: vars.system.colors.textSecondary },
});

export const progressBarTrack = style({
  boxSizing: "border-box",
  overflow: "hidden",
  position: "relative",
  width: "100%",
  borderRadius: vars.ref.radius.full,
  backgroundColor: vars.system.colors.backgroundBody,
});

export const progressBarTrackSize = styleVariants({
  "sm": { height: vars.ref.spacing[1] },
  "md": { height: vars.ref.spacing[2] },
});

export const progressBarIndicator = style({
  height: "100%",
  boxSizing: "border-box",
  borderRadius: vars.ref.radius.full,
  transitionProperty: "width",
  transitionDuration: "200ms",
  selectors: {
    "[data-indeterminate] &": {
      width: "25% !important",
      animationName: indeterminateSweep,
      animationDuration: vars.system.motion.mediumMax,
      animationIterationCount: "infinite",
      animationTimingFunction: "ease-in-out",
    },
  },
});

export const progressBarIndicatorStatus = styleVariants({
  "default": { backgroundColor: vars.system.colors.accent },
  "success": { backgroundColor: vars.ref.color.success },
  "danger": { backgroundColor: vars.ref.color.error },
});
