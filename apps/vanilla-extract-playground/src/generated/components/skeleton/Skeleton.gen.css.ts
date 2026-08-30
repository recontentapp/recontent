import { keyframes, style, styleVariants } from "@vanilla-extract/css";
import { refRadius, vars } from "../../tokens.css";

const shimmer = keyframes({
  "0%": { backgroundPosition: "150% 0" },
  "100%": { backgroundPosition: "-50% 0" },
});

export const skeletonRoot = style({
  boxSizing: "border-box",
  display: "block",
  backgroundColor: vars.system.colors.skeleton,
});

export const skeletonAnimate = style({
  backgroundImage: `linear-gradient(90deg, transparent, ${vars.ref.color.secondary[50]}, transparent)`,
  backgroundSize: "200% 100%",
  animationName: shimmer,
  animationDuration: vars.system.motion.slowMin,
  animationIterationCount: "infinite",
  animationTimingFunction: "linear",
});

export const skeletonVariant = styleVariants({
  text: {
    height: "1em",
  },
  circular: {
    borderRadius: vars.ref.radius.full,
  },
  rectangular: {},
});

export const skeletonRadius = styleVariants(refRadius, (value) => ({ borderRadius: value }));

export const skeletonLines = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.ref.spacing[8],
});

export const skeletonLastLine = style({
  width: "80%",
});
