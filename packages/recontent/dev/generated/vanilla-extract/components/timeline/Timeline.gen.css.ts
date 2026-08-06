import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const timelineRoot = style({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  listStyle: "none",
  margin: 0,
  padding: 0,
  gap: vars.ref.spacing[1],
  selectors: {
    '&[data-orientation="horizontal"]': {
      flexDirection: "row",
    },
  },
});

export const timelineItem = style({
  display: "flex",
  boxSizing: "border-box",
  selectors: {
    '[data-orientation="vertical"] &': {
      flexDirection: "row",
    },
    '[data-orientation="horizontal"] &': {
      flexDirection: "column",
    },
  },
});

export const timelineIndicatorColumn = style({
  display: "flex",
  alignItems: "center",
  selectors: {
    '[data-orientation="vertical"] &': {
      flexDirection: "column",
    },
  },
});

export const timelineIndicator = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  flexShrink: 0,
  borderRadius: "50%",
});

export const timelineIndicatorSize = styleVariants({
  "sm": { width: vars.ref.spacing[4], height: vars.ref.spacing[4] },
  "md": { width: vars.ref.spacing[5], height: vars.ref.spacing[5] },
});

export const timelineIndicatorStatus = styleVariants({
  "neutral": {
      color: vars.system.colors.textSecondary,
      backgroundColor: vars.system.colors.backgroundBody,
      border: vars.system.border.default,
    },
  "success": {
      color: vars.ref.color.white,
      backgroundColor: vars.ref.color.success,
      border: vars.system.border.default,
    },
  "error": {
      color: vars.ref.color.white,
      backgroundColor: vars.ref.color.error,
      border: vars.system.border.default,
    },
});

export const timelineIcon = style({
  width: "60%",
  height: "60%",
});

export const timelineConnector = style({
  flex: 1,
  boxSizing: "border-box",
  backgroundColor: vars.system.colors.border,
  selectors: {
    '[data-orientation="vertical"] &': {
      width: vars.ref.spacing["0-5"],
      marginTop: vars.ref.spacing[1],
      marginBottom: vars.ref.spacing[1],
    },
    '[data-orientation="horizontal"] &': {
      height: vars.ref.spacing["0-5"],
      marginLeft: vars.ref.spacing[1],
      marginRight: vars.ref.spacing[1],
    },
  },
});

export const timelineContent = style({
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  paddingLeft: "0.5rem",
  paddingBottom: "0.5rem",
});

export const timelineContentSize = styleVariants({
  "sm": { gap: vars.ref.spacing[1], fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight },
  "md": { gap: vars.ref.spacing[2], fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight },
});

export const timelineLabel = style({
  margin: 0,
  color: vars.system.colors.textPrimary,
  fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
});

export const timelineTimestamp = style({
  margin: 0,
  color: vars.system.colors.textDisabled,
  fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
});

export const timelineDescription = style({
  margin: 0,
  color: vars.system.colors.textSecondary,
  fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
});
