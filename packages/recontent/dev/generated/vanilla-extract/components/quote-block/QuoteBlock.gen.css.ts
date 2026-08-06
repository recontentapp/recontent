import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const quoteBlockRoot = style({
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: vars.ref.spacing[2],
  boxSizing: "border-box",
  borderLeft: vars.system.border.default,
  paddingLeft: vars.ref.spacing[4],
  paddingRight: vars.ref.spacing[4],
  paddingTop: vars.ref.spacing[2],
  paddingBottom: vars.ref.spacing[2],
});

export const quoteBlockQuote = style({
  margin: 0,
  color: vars.system.colors.textPrimary,
  fontFamily: vars.system.textStyles.body.fontFamily,
    fontSize: vars.system.textStyles.body.fontSize,
    fontWeight: vars.system.textStyles.body.fontWeight,
    letterSpacing: vars.system.textStyles.body.letterSpacing,
    lineHeight: vars.system.textStyles.body.lineHeight,
});

export const quoteBlockCitation = style({
  margin: 0,
  color: vars.system.colors.textSecondary,
  fontFamily: vars.system.textScale.supporting.fontFamily,
    fontSize: vars.system.textScale.supporting.fontSize,
    fontWeight: vars.system.textScale.supporting.fontWeight,
    letterSpacing: vars.system.textScale.supporting.letterSpacing,
    lineHeight: vars.system.textScale.supporting.lineHeight,
});
