import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const selectableCardRoot = style({
  display: "flex",
  boxSizing: "border-box",
  textAlign: "left",
  cursor: "pointer",
  width: "100%",
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.container,
  backgroundColor: vars.system.colors.backgroundCard,
  paddingLeft: vars.ref.spacing[16],
  paddingRight: vars.ref.spacing[16],
  paddingTop: vars.ref.spacing[12],
  paddingBottom: vars.ref.spacing[12],
  ":hover": {
    borderColor: vars.system.colors.borderEmphasized,
  },
  ":focus-visible": {
    outline: "none",
    boxShadow: `0 0 0 2px ${vars.system.colors.accent}`,
  },
  selectors: {
    "&[data-selected]": {
      backgroundColor: vars.system.colors.backgroundMuted,
      borderColor: vars.system.colors.accent,
    },
    "&:disabled": {
      backgroundColor: vars.system.colors.backgroundBody,
      color: vars.system.colors.textDisabled,
      cursor: "not-allowed",
    },
  },
});
