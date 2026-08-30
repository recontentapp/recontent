import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const dividerRoot = style({
  boxSizing: "border-box",
  flexShrink: 0,
  borderRadius: vars.ref.radius.none,
});

export const dividerOrientation = styleVariants({
  horizontal: {
    width: "100%",
    height: 0,
    borderTop: vars.system.border.default,
    borderColor: vars.system.colors.border,
    marginTop: vars.ref.spacing[8],
    marginBottom: vars.ref.spacing[8],
  },
  vertical: {
    height: "100%",
    width: 0,
    alignSelf: "stretch",
    borderLeft: vars.system.border.default,
    borderColor: vars.system.colors.border,
    marginLeft: vars.ref.spacing[8],
    marginRight: vars.ref.spacing[8],
  },
});
