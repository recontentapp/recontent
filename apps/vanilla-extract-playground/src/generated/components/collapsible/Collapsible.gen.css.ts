import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const collapsibleRoot = style({
  boxSizing: "border-box",
  borderRadius: vars.ref.radius.element,
  border: vars.system.border.default,
  backgroundColor: vars.system.colors.backgroundCard,
  overflow: "hidden",
});

export const collapsibleTrigger = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  boxSizing: "border-box",
  cursor: "pointer",
  border: "none",
  backgroundColor: "transparent",
  color: vars.system.colors.textPrimary,
  paddingLeft: vars.ref.spacing[16],
  paddingRight: vars.ref.spacing[16],
  paddingTop: vars.ref.spacing[12],
  paddingBottom: vars.ref.spacing[12],
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
    fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
    fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
    letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
    lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
  transitionProperty: "background-color",
  transitionDuration: vars.system.transitionScale.fast.transitionDuration,
  transitionTimingFunction: vars.system.transitionScale.fast.transitionTimingFunction,
  selectors: {
    "&:hover, &:focus-visible": {
      backgroundColor: vars.system.colors.backgroundBody,
    },
  },
  ":focus-visible": {
    outline: "none",
    boxShadow: `0 0 0 2px ${vars.system.colors.accent}`,
  },
});

export const collapsibleIndicator = style({
  display: "inline-flex",
  flexShrink: 0,
  width: "1em",
  height: "1em",
  transitionProperty: "transform",
  transitionDuration: vars.system.transitionScale.fast.transitionDuration,
  transitionTimingFunction: vars.system.transitionScale.fast.transitionTimingFunction,
  selectors: {
    "[data-panel-open] &": { transform: "rotate(180deg)" },
  },
});

export const collapsiblePanel = style({
  overflow: "hidden",
  height: "var(--collapsible-panel-height)",
  transitionProperty: "height",
  transitionDuration: vars.system.transitionScale.fast.transitionDuration,
  transitionTimingFunction: vars.system.transitionScale.fast.transitionTimingFunction,
  selectors: {
    "&[data-starting-style], &[data-ending-style]": {
      height: 0,
    },
  },
});

export const collapsiblePanelContent = style({
  boxSizing: "border-box",
  paddingLeft: vars.ref.spacing[16],
  paddingRight: vars.ref.spacing[16],
  paddingTop: vars.ref.spacing[12],
  paddingBottom: vars.ref.spacing[12],
});
