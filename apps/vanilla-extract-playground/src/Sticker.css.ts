import { style } from "@vanilla-extract/css";
import { componentVars, systemVars } from "./generated/tokens.css";

export const sticker = style({
  display: "inline-flex",
  alignItems: "center",
  paddingInline: componentVars.sticker.paddingX,
  paddingBlock: componentVars.sticker.paddingY,
  borderRadius: componentVars.sticker.borderRadius,
  backgroundColor: systemVars.colors.accent,
  color: systemVars.colors.onAccent,
  fontFamily: systemVars.textScale["tiny-caption-strong"].fontFamily,
  fontSize: systemVars.textScale["tiny-caption-strong"].fontSize,
  fontWeight: systemVars.textScale["tiny-caption-strong"].fontWeight,
  lineHeight: systemVars.textScale["tiny-caption-strong"].lineHeight,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  selectors: {
    '&[data-tilt="left"]': {
      transform: "rotate(-4deg)",
    },
    '&[data-tilt="right"]': {
      transform: "rotate(4deg)",
    },
  },
});
