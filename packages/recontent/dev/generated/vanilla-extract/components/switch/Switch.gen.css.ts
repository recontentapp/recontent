import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const switchRoot = style({
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  gap: vars.ref.spacing[2],
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
  transitionDuration: vars.system.motion.fast,
  ":focus-visible": {
    outline: `2px solid ${vars.system.colors.accent}`,
    outlineOffset: "2px",
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
  "sm": { width: vars.ref.spacing[6], height: vars.ref.spacing[3] },
  "md": { width: vars.ref.spacing[8], height: vars.ref.spacing[4] },
});

export const switchThumb = style({
  boxSizing: "border-box",
  borderRadius: vars.ref.radius.full,
  backgroundColor: vars.ref.color.white,
  boxShadow: vars.system.elevation.sm,
  transitionProperty: "translate",
  transitionDuration: vars.system.motion.fast,
  translate: "2px",
  selectors: {
    "[data-checked] > &": {
      translate: "calc(100% - 2px)",
    },
  },
});

export const switchThumbSize = styleVariants({
  "sm": { width: vars.ref.spacing[2], height: vars.ref.spacing[2] },
  "md": { width: vars.ref.spacing[3], height: vars.ref.spacing[3] },
});

export const switchLabel = style({
  color: vars.system.colors.textPrimary,
  fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
});
