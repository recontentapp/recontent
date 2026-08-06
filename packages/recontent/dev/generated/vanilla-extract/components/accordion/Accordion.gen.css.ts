import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const accordionRoot = style({
  boxSizing: "border-box",
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  overflow: "hidden",
});

export const accordionItem = style({
  boxSizing: "border-box",
  borderBottom: vars.system.border.default,
  selectors: {
    "&:last-child": { borderBottom: "none" },
  },
});

export const accordionHeader = style({
  margin: 0,
});

export const accordionTrigger = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  boxSizing: "border-box",
  cursor: "pointer",
  border: "none",
  backgroundColor: "transparent",
  color: vars.system.colors.textPrimary,
  paddingLeft: vars.ref.spacing[4],
  paddingRight: vars.ref.spacing[4],
  paddingTop: vars.ref.spacing[3],
  paddingBottom: vars.ref.spacing[3],
  fontFamily: vars.system.textStyles.body.fontFamily,
    fontSize: vars.system.textStyles.body.fontSize,
    fontWeight: vars.system.textStyles.body.fontWeight,
    letterSpacing: vars.system.textStyles.body.letterSpacing,
    lineHeight: vars.system.textStyles.body.lineHeight,
  ":hover": {
    backgroundColor: vars.system.colors.backgroundBody,
  },
});

export const accordionIndicator = style({
  display: "inline-flex",
  flexShrink: 0,
  width: "1em",
  height: "1em",
  transitionProperty: "transform",
  transitionDuration: vars.system.motion.fast,
  selectors: {
    "[data-panel-open] &": { transform: "rotate(180deg)" },
  },
});

export const accordionPanel = style({
  overflow: "hidden",
});

export const accordionContent = style({
  boxSizing: "border-box",
  paddingLeft: vars.ref.spacing[4],
  paddingRight: vars.ref.spacing[4],
  paddingTop: vars.ref.spacing[3],
  paddingBottom: vars.ref.spacing[3],
});
