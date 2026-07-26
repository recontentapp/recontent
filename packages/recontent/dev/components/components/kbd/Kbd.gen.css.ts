import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const kbdRoot = style({
  display: "inline-flex",
  width: "fit-content",
  height: vars.system.spacing[5],
  alignItems: "center",
  justifyContent: "center",
  gap: vars.system.spacing[1],
  borderRadius: vars.system.radius.inner,
  border: `${vars.system.size.borderWidth} solid ${vars.system.colors.border}`,
  backgroundColor: vars.system.colors.backgroundBody,
  paddingInline: vars.system.spacing[1],
  fontFamily: vars.system.typography.codeFontFamily,
  fontSize: vars.system.typography.supportingSize,
  fontWeight: vars.system.typography.mediumWeight,
  color: vars.system.colors.textSecondary,
  pointerEvents: "none",
  userSelect: "none",
});
