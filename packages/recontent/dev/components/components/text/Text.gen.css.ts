import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const textRoot = style({
  margin: 0,
  fontFamily: vars.system.typography.bodyFontFamily,
  fontSize: vars.system.typography.bodySize,
  lineHeight: vars.system.typography.bodyLeading,
  fontWeight: vars.system.typography.normalWeight,
  color: vars.system.colors.textPrimary,
});
