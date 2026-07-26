import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const blockquoteRoot = style({
  margin: 0,
  marginBlockStart: vars.system.spacing[6],
  borderInlineStart: `${vars.system.size.borderWidth} solid ${vars.system.colors.border}`,
  paddingInlineStart: vars.system.spacing[6],
  fontStyle: "italic",
  color: vars.system.colors.textPrimary,
});
