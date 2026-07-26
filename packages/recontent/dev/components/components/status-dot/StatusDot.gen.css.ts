import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const statusDotRoot = style({
  display: "inline-flex",
  flexShrink: 0,
  width: vars.system.spacing[2],
  height: vars.system.spacing[2],
  borderRadius: "50%",
});

export const statusDotVariant = styleVariants({
  "success": {
    backgroundColor: vars.system.colors.success,
  },
  "warning": {
    backgroundColor: vars.system.colors.warning,
  },
  "error": {
    backgroundColor: vars.system.colors.error,
  },
});
