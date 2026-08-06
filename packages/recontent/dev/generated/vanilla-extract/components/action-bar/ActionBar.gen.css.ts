import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const actionBarRoot = style({
  position: "fixed",
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  zIndex: 40,
  backgroundColor: vars.system.colors.backgroundSurface,
  color: vars.system.colors.textPrimary,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.container,
  boxShadow: vars.system.elevation.md,
  gap: vars.ref.spacing[2],
  paddingLeft: vars.ref.spacing[3],
  paddingRight: vars.ref.spacing[3],
  paddingTop: vars.ref.spacing[2],
  paddingBottom: vars.ref.spacing[2],
});

export const actionBarHidden = style({
  display: "none",
});

export const actionBarPlacement = styleVariants({
  "bottom-start": {
    bottom: vars.ref.spacing[6],
    left: vars.ref.spacing[6],
  },
  bottom: {
    bottom: vars.ref.spacing[6],
    left: "50%",
    transform: "translateX(-50%)",
  },
  "bottom-end": {
    bottom: vars.ref.spacing[6],
    right: vars.ref.spacing[6],
  },
});
