import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const badgeRoot = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.system.spacing[1],
  height: vars.system.spacing[5],
  paddingInline: vars.system.spacing[2],
  borderRadius: vars.system.radius.full,
  fontSize: vars.system.typography.supportingSize,
  lineHeight: vars.system.typography.supportingLeading,
  fontWeight: vars.system.typography.mediumWeight,
  whiteSpace: "nowrap",
});

export const badgeVariant = styleVariants({
  "premium": {
    backgroundColor: vars.system.colors.secondary[200],
    color: vars.system.colors.onAccent,
    border: `1px solid ${vars.system.colors.accent}`,
  },
});
