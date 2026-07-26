import { keyframes, style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

const skeletonPulse = keyframes({
  "0%": { opacity: 1 },
  "50%": { opacity: 0.5 },
  "100%": { opacity: 1 },
});

export const skeletonRoot = style({
  borderRadius: vars.system.radius.inner,
  backgroundColor: vars.system.colors.skeleton,
  animation: `${skeletonPulse} 2s ease-in-out infinite`,
});
