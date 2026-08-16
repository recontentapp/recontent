import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const tooltipPositioner = style({
  outline: "none",
  zIndex: 70,
  selectors: {
    '&[data-side="top"]': { marginBottom: vars.ref.spacing[4] },
    '&[data-side="bottom"]': { marginTop: vars.ref.spacing[4] },
    '&[data-side="left"]': { marginRight: vars.ref.spacing[4] },
    '&[data-side="right"]': { marginLeft: vars.ref.spacing[4] },
  },
});

export const tooltipPopup = style({
  boxSizing: "border-box",
  maxWidth: vars.ref.overlayWidth.sm,
  color: vars.ref.color.white[100],
  backgroundColor: vars.ref.color.secondary[900],
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.inner,
  boxShadow: vars.system.elevationScale.sm,
  paddingLeft: vars.ref.spacing[8],
  paddingRight: vars.ref.spacing[8],
  paddingTop: vars.ref.spacing[4],
  paddingBottom: vars.ref.spacing[4],
  fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
      fontSize: vars.system.textScale["tiny-caption"].fontSize,
      fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
      letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
      lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
  transitionProperty: "opacity, transform",
  transitionDuration: vars.system.transitionScale.fast.transitionDuration,
  transitionTimingFunction: vars.system.transitionScale.fast.transitionTimingFunction,
  selectors: {
    "&[data-starting-style], &[data-ending-style]": {
      opacity: 0,
    },
  },
});

export const tooltipArrow = style({
  width: vars.ref.spacing[8],
  height: vars.ref.spacing[8],
  selectors: {
    '&[data-side="top"]': { bottom: `calc(vars.ref.spacing[8] / -2)` },
    '&[data-side="bottom"]': { top: `calc(vars.ref.spacing[8] / -2)` },
    '&[data-side="left"]': { right: `calc(vars.ref.spacing[8] / -2)` },
    '&[data-side="right"]': { left: `calc(vars.ref.spacing[8] / -2)` },
  },
});

export const tooltipArrowShape = style({
  width: "100%",
  height: "100%",
  backgroundColor: vars.ref.color.secondary[900],
  transform: "rotate(45deg)",
  borderRadius: "2px",
});
