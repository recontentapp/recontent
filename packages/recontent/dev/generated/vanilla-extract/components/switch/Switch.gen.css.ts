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

export const switchTrackSize = styleVariants({
  "sm": { width: vars.ref.spacing[24], height: vars.ref.spacing[12] },
  "md": { width: vars.ref.spacing[32], height: vars.ref.spacing[16] },
});

export const switchThumb = style({
  boxSizing: "border-box",
  borderRadius: vars.ref.radius.full,
  backgroundColor: vars.ref.color.white[100],
  boxShadow: vars.system.elevationScale.sm,
  transitionProperty: "translate",
  transitionDuration: vars.system.transitionScale.fast.transitionDuration,
  transitionTimingFunction: vars.system.transitionScale.fast.transitionTimingFunction,
  translate: "2px",
  selectors: {
    "[data-checked] > &": {
      translate: "calc(100% - 2px)",
    },
  },
});

export const switchThumbSize = styleVariants({
  "sm": { width: vars.ref.spacing[8], height: vars.ref.spacing[8] },
  "md": { width: vars.ref.spacing[12], height: vars.ref.spacing[12] },
});

export const switchLabel = style({
  color: vars.system.colors.textPrimary,
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
});
