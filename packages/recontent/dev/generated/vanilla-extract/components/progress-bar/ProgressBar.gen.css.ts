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
  gap: vars.ref.spacing[4],
});

export const progressBarLabelRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.ref.spacing[4],
  fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
      fontSize: vars.system.textScale["tiny-caption"].fontSize,
      fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
      letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
      lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
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
  "sm": { height: vars.ref.spacing[4] },
  "md": { height: vars.ref.spacing[8] },
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
  "success": { backgroundColor: vars.ref.color.success[500] },
  "danger": { backgroundColor: vars.ref.color.danger[500] },
});
