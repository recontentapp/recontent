import { keyframes, style, styleVariants } from "@vanilla-extract/css";
import { refIconScale, systemColorsTextScale, vars } from "../../tokens.css";

const spin = keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

export const spinnerRoot = style({
  boxSizing: "border-box",
  display: "inline-block",
  flexShrink: 0,
  borderRadius: "50%",
  borderStyle: "solid",
  borderWidth: vars.ref.spacing[2],
  borderColor: vars.system.colors.backgroundMuted,
  animationName: spin,
  animationDuration: vars.system.motion.mediumMax,
  animationIterationCount: "infinite",
  animationTimingFunction: "linear",
});

export const spinnerSize = styleVariants(refIconScale, (value) => ({
  width: value,
  height: value,
}));

export const spinnerColor = styleVariants(systemColorsTextScale, (value) => ({
  borderTopColor: value,
}));
