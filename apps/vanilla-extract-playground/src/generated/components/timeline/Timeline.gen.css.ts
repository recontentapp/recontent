import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const timelineRoot = style({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  listStyle: "none",
  margin: 0,
  padding: 0,
  gap: vars.ref.spacing[4],
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
  "sm": { width: vars.ref.spacing[16], height: vars.ref.spacing[16] },
  "md": { width: vars.ref.spacing[20], height: vars.ref.spacing[20] },
});

export const timelineIndicatorStatus = styleVariants({
  "neutral": {
      color: vars.system.colors.textSecondary,
      backgroundColor: vars.system.colors.backgroundBody,
      border: vars.system.border.default,
    },
  "success": {
      color: vars.ref.color.white[100],
      backgroundColor: vars.ref.color.success[500],
      border: vars.system.border.default,
    },
  "error": {
      color: vars.ref.color.white[100],
      backgroundColor: vars.ref.color.danger[500],
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
      width: vars.ref.spacing[2],
      marginTop: vars.ref.spacing[4],
      marginBottom: vars.ref.spacing[4],
    },
    '[data-orientation="horizontal"] &': {
      height: vars.ref.spacing[2],
      marginLeft: vars.ref.spacing[4],
      marginRight: vars.ref.spacing[4],
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
  "sm": { gap: vars.ref.spacing[4], fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
      fontSize: vars.system.textScale["tiny-caption"].fontSize,
      fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
      letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
      lineHeight: vars.system.textScale["tiny-caption"].lineHeight },
  "md": { gap: vars.ref.spacing[8], fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight },
});

export const timelineLabel = style({
  margin: 0,
  color: vars.system.colors.textPrimary,
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
});

export const timelineTimestamp = style({
  margin: 0,
  color: vars.system.colors.textDisabled,
  fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
      fontSize: vars.system.textScale["tiny-caption"].fontSize,
      fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
      letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
      lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
});

export const timelineDescription = style({
  margin: 0,
  color: vars.system.colors.textSecondary,
  fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
      fontSize: vars.system.textScale["tiny-caption"].fontSize,
      fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
      letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
      lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
});
