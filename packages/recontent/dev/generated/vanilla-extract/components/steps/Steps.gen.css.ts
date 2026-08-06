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
  "sm": { gap: vars.ref.spacing[2] },
  "md": { gap: vars.ref.spacing[3] },
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
  "sm": { width: vars.ref.spacing[5], height: vars.ref.spacing[5] },
  "md": { width: vars.ref.spacing[6], height: vars.ref.spacing[6] },
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
      backgroundColor: vars.ref.color.error,
      color: vars.ref.color.white,
      border: vars.system.border.default,
    },
});

export const stepsConnector = style({
  flex: 1,
  boxSizing: "border-box",
  height: vars.ref.spacing["0-5"],
  marginLeft: vars.ref.spacing[1],
  marginRight: vars.ref.spacing[1],
  selectors: {
    '[data-orientation="vertical"] &': {
      width: vars.ref.spacing["0-5"],
      height: "auto",
      marginLeft: 0,
      marginRight: 0,
      marginTop: vars.ref.spacing[1],
      marginBottom: vars.ref.spacing[1],
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
  fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
});

export const stepsLabelStatus = styleVariants({
  "complete": { color: vars.system.colors.textPrimary },
  "current": { color: vars.system.colors.textPrimary },
  "upcoming": { color: vars.system.colors.textSecondary },
  "error": { color: vars.ref.color.error },
});

export const stepsDescription = style({
  margin: 0,
  color: vars.system.colors.textSecondary,
  fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
});
