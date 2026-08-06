import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const tooltipPositioner = style({
  outline: "none",
  zIndex: 70,
  selectors: {
    '&[data-side="top"]': { marginBottom: vars.ref.spacing[1] },
    '&[data-side="bottom"]': { marginTop: vars.ref.spacing[1] },
    '&[data-side="left"]': { marginRight: vars.ref.spacing[1] },
    '&[data-side="right"]': { marginLeft: vars.ref.spacing[1] },
  },
});

export const tooltipPopup = style({
  boxSizing: "border-box",
  maxWidth: vars.ref.overlayWidth.sm,
  color: vars.ref.color.white,
  backgroundColor: vars.ref.color.gray950,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.inner,
  boxShadow: vars.system.elevation.sm,
  paddingLeft: vars.ref.spacing[2],
  paddingRight: vars.ref.spacing[2],
  paddingTop: vars.ref.spacing[1],
  paddingBottom: vars.ref.spacing[1],
  fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
  transitionProperty: "opacity, transform",
  transitionDuration: vars.system.motion.fast,
  selectors: {
    "&[data-starting-style], &[data-ending-style]": {
      opacity: 0,
    },
  },
});

export const tooltipArrow = style({
  width: vars.ref.spacing[2],
  height: vars.ref.spacing[2],
  selectors: {
    '&[data-side="top"]': { bottom: `calc(vars.ref.spacing[2] / -2)` },
    '&[data-side="bottom"]': { top: `calc(vars.ref.spacing[2] / -2)` },
    '&[data-side="left"]': { right: `calc(vars.ref.spacing[2] / -2)` },
    '&[data-side="right"]': { left: `calc(vars.ref.spacing[2] / -2)` },
  },
});

export const tooltipArrowShape = style({
  width: "100%",
  height: "100%",
  backgroundColor: vars.ref.color.gray950,
  transform: "rotate(45deg)",
  borderRadius: "2px",
});
