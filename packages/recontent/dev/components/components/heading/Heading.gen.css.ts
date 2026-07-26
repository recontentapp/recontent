import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const headingRoot = style({
  margin: 0,
  fontFamily: vars.system.typography.bodyFontFamily,
});

export const headingLevel = styleVariants({
  "1": {
    fontSize: vars.system.typography.heading1Size,
    lineHeight: vars.system.typography.heading1Leading,
    fontWeight: vars.system.typography.boldWeight,
    color: vars.system.colors.textPrimary,
  },
  "2": {
    fontSize: vars.system.typography.heading2Size,
    lineHeight: vars.system.typography.heading2Leading,
    fontWeight: vars.system.typography.semiboldWeight,
    color: vars.system.colors.textPrimary,
  },
  "3": {
    fontSize: vars.system.typography.heading3Size,
    lineHeight: vars.system.typography.heading3Leading,
    fontWeight: vars.system.typography.semiboldWeight,
    color: vars.system.colors.textPrimary,
  },
  "4": {
    fontSize: vars.system.typography.heading4Size,
    lineHeight: vars.system.typography.heading4Leading,
    fontWeight: vars.system.typography.semiboldWeight,
    color: vars.system.colors.textPrimary,
  },
  "5": {
    fontSize: vars.system.typography.heading5Size,
    lineHeight: vars.system.typography.heading5Leading,
    fontWeight: vars.system.typography.mediumWeight,
    color: vars.system.colors.textPrimary,
  },
  "6": {
    fontSize: vars.system.typography.heading6Size,
    lineHeight: vars.system.typography.heading6Leading,
    fontWeight: vars.system.typography.mediumWeight,
    color: vars.system.colors.textPrimary,
  },
});
