import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const cardRoot = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.system.spacing[6],
  borderRadius: vars.system.radius.element,
  border: `${vars.system.size.borderWidth} solid ${vars.system.colors.border}`,
  backgroundColor: vars.system.colors.backgroundCard,
  color: vars.system.colors.textPrimary,
});

export const cardHeader = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.system.spacing["1-5"],
  padding: vars.system.spacing[6],
});

export const cardTitle = style({
  fontSize: vars.system.typography.heading5Size,
  fontWeight: vars.system.typography.semiboldWeight,
  lineHeight: vars.system.typography.heading5Leading,
});

export const cardDescription = style({
  fontSize: vars.system.typography.bodySize,
  color: vars.system.colors.textSecondary,
});

export const cardContent = style({
  paddingInline: vars.system.spacing[6],
});

export const cardFooter = style({
  display: "flex",
  alignItems: "center",
  padding: vars.system.spacing[6],
  paddingTop: 0,
});
