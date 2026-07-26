import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const citationRoot = style({
  fontStyle: "italic",
  fontSize: vars.system.typography.supportingSize,
  lineHeight: vars.system.typography.supportingLeading,
  fontWeight: vars.system.typography.normalWeight,
  color: vars.system.colors.textSecondary,
});
