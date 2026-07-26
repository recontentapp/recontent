import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const dividerRoot = style({
  flexShrink: 0,
  backgroundColor: vars.system.colors.border,
});

export const dividerOrientation = styleVariants({
  horizontal: {
    height: vars.system.size.borderWidth,
    width: "100%",
  },
  vertical: {
    width: vars.system.size.borderWidth,
    alignSelf: "stretch",
  },
});
