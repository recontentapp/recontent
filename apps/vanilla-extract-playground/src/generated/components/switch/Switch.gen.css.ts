import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const switchRoot = style({
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  gap: vars.ref.spacing[8],
  selectors: {
    "&[data-disabled]": {
      cursor: "not-allowed",
    },
  },
});

export const switchRootLabelPosition = styleVariants({
  start: { flexDirection: "row-reverse" },
  end: { flexDirection: "row" },
});

export const switchTrack = style({
  boxSizing: "border-box",
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
  width: vars.components.switch.trackWidth,
  height: vars.components.switch.trackHeight,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.full,
  backgroundColor: vars.system.colors.backgroundMuted,
  transitionProperty: "background-color",
  transitionDuration: vars.system.transitionScale.fast.transitionDuration,
  transitionTimingFunction: vars.system.transitionScale.fast.transitionTimingFunction,
  ":focus-visible": {
    outline: "none",
    boxShadow: `0 0 0 2px ${vars.system.colors.accent}`,
  },
  selectors: {
    "&[data-checked]": {
      backgroundColor: vars.system.colors.accent,
    },
    "&[data-disabled]": {
      backgroundColor: vars.system.colors.backgroundBody,
      cursor: "not-allowed",
    },
  },
});

export const switchThumb = style({
  boxSizing: "border-box",
  position: "absolute",
  top: "50%",
  left: "2px",
  translate: "0 -50%",
  width: vars.components.switch.thumbSize,
  height: vars.components.switch.thumbSize,
  borderRadius: vars.ref.radius.full,
  backgroundColor: vars.ref.color.white[100],
  boxShadow: vars.system.elevationScale.sm,
  transitionProperty: "left",
  transitionDuration: vars.system.transitionScale.fast.transitionDuration,
  transitionTimingFunction: vars.system.transitionScale.fast.transitionTimingFunction,
  selectors: {
    "[data-checked] > &": {
      left: `calc(100% - ${vars.components.switch.thumbSize} - 2px)`,
    },
  },
});

export const switchLabel = style({
  color: vars.system.colors.textPrimary,
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
});
