import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const sliderRoot = style({
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  position: "relative",
  touchAction: "none",
  selectors: {
    "&[data-disabled]": {
      cursor: "not-allowed",
    },
  },
});

export const sliderControl = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  boxSizing: "border-box",
  height: vars.ref.spacing[3],
  selectors: {
    '&[data-orientation="vertical"]': {
      flexDirection: "column",
      width: vars.ref.spacing[3],
      height: "100%",
    },
  },
});

export const sliderTrack = style({
  position: "relative",
  width: "100%",
  height: vars.ref.spacing["0-5"],
  borderRadius: vars.ref.radius.full,
  backgroundColor: vars.system.colors.backgroundBody,
  selectors: {
    '[data-orientation="vertical"] &': {
      width: vars.ref.spacing["0-5"],
      height: "100%",
    },
    "[data-disabled] &": {
      backgroundColor: vars.system.colors.backgroundMuted,
    },
  },
});

export const sliderIndicator = style({
  position: "absolute",
  borderRadius: vars.ref.radius.full,
  backgroundColor: vars.system.colors.accent,
  selectors: {
    '[data-orientation="horizontal"] &': { height: "100%" },
    '[data-orientation="vertical"] &': { width: "100%" },
  },
});

export const sliderThumb = style({
  boxSizing: "border-box",
  width: vars.ref.spacing[3],
  height: vars.ref.spacing[3],
  borderRadius: "50%",
  border: vars.system.border.default,
  backgroundColor: vars.ref.color.white,
  boxShadow: vars.system.elevation.sm,
  ":hover": {
    backgroundColor: vars.ref.color.white,
  },
  ":focus-visible": {
    outline: `2px solid ${vars.system.colors.accent}`,
    outlineOffset: "2px",
  },
  selectors: {
    "&[data-disabled]": {
      backgroundColor: vars.system.colors.backgroundMuted,
    },
  },
});

export const sliderMarks = style({
  position: "relative",
  width: "100%",
});

export const sliderMark = style({
  position: "absolute",
  transform: "translateX(-50%)",
  color: vars.system.colors.textSecondary,
  fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
});

export const sliderValueLabel = style({
  position: "absolute",
  bottom: "100%",
  left: "50%",
  transform: "translateX(-50%)",
  marginBottom: "0.5rem",
  boxSizing: "border-box",
  whiteSpace: "nowrap",
  color: vars.system.colors.onAccent,
  backgroundColor: vars.system.colors.accent,
  borderRadius: vars.ref.radius.full,
  paddingLeft: "0.375rem",
  paddingRight: "0.375rem",
  paddingTop: "0.125rem",
  paddingBottom: "0.125rem",
  fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
});
