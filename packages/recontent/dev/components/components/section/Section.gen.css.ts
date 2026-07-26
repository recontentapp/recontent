import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const sectionRoot = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.system.spacing[6],
  paddingBlock: vars.system.spacing[8],
  paddingInline: vars.system.spacing[6],
  backgroundColor: vars.system.colors.backgroundSurface,
  color: vars.system.colors.textPrimary,
});
