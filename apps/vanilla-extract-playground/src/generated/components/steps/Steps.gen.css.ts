import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const stepsRoot = style({
  display: "flex",
  boxSizing: "border-box",
  listStyle: "none",
  margin: 0,
  padding: 0,
  selectors: {
    '&[data-orientation="vertical"]': {
      flexDirection: "column",
    },
  },
});

export const stepsRootSize = styleVariants({
  "sm": { gap: vars.ref.spacing[8] },
  "md": { gap: vars.ref.spacing[12] },
});

export const stepsStep = style({
  display: "flex",
  flex: 1,
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

export const stepsIndicatorRow = style({
  display: "flex",
  alignItems: "center",
  selectors: {
    '[data-orientation="vertical"] &': {
      flexDirection: "column",
    },
  },
});

export const stepsIndicator = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  flexShrink: 0,
  borderRadius: vars.ref.radius.full,
});

export const stepsIndicatorSize = styleVariants({
  "sm": { width: vars.ref.spacing[20], height: vars.ref.spacing[20] },
  "md": { width: vars.ref.spacing[24], height: vars.ref.spacing[24] },
});

export const stepsIndicatorStatus = styleVariants({
  "complete": {
      backgroundColor: vars.system.colors.accent,
      color: vars.system.colors.onAccent,
      border: vars.system.border.default,
    },
  "current": {
      backgroundColor: vars.system.colors.backgroundCard,
      color: vars.system.colors.accent,
      border: vars.system.border.default,
    },
  "upcoming": {
      backgroundColor: vars.system.colors.backgroundCard,
      color: vars.system.colors.textDisabled,
      border: vars.system.border.default,
    },
  "error": {
      backgroundColor: vars.ref.color.danger[500],
      color: vars.ref.color.white[100],
      border: vars.system.border.default,
    },
});

export const stepsConnector = style({
  flex: 1,
  boxSizing: "border-box",
  height: vars.ref.spacing[2],
  marginLeft: vars.ref.spacing[4],
  marginRight: vars.ref.spacing[4],
  selectors: {
    '[data-orientation="vertical"] &': {
      width: vars.ref.spacing[2],
      height: "auto",
      marginLeft: 0,
      marginRight: 0,
      marginTop: vars.ref.spacing[4],
      marginBottom: vars.ref.spacing[4],
    },
  },
});

export const stepsConnectorStatus = styleVariants({
  "complete": { backgroundColor: vars.system.colors.accent },
  "current": { backgroundColor: vars.system.colors.border },
  "upcoming": { backgroundColor: vars.system.colors.border },
  "error": { backgroundColor: vars.system.colors.border },
});

export const stepsContent = style({
  boxSizing: "border-box",
  paddingLeft: "0.5rem",
});

export const stepsLabel = style({
  margin: 0,
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
});

export const stepsLabelStatus = styleVariants({
  "complete": { color: vars.system.colors.textPrimary },
  "current": { color: vars.system.colors.textPrimary },
  "upcoming": { color: vars.system.colors.textSecondary },
  "error": { color: vars.ref.color.danger[500] },
});

export const stepsDescription = style({
  margin: 0,
  color: vars.system.colors.textSecondary,
  fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
      fontSize: vars.system.textScale["tiny-caption"].fontSize,
      fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
      letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
      lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
});
