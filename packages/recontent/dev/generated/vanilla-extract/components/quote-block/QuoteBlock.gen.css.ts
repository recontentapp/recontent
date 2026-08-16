import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const quoteBlockRoot = style({
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: vars.ref.spacing[8],
  boxSizing: "border-box",
  borderLeft: vars.system.border.default,
  paddingLeft: vars.ref.spacing[16],
  paddingRight: vars.ref.spacing[16],
  paddingTop: vars.ref.spacing[8],
  paddingBottom: vars.ref.spacing[8],
});

export const quoteBlockQuote = style({
  margin: 0,
  color: vars.system.colors.textPrimary,
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
    fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
    fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
    letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
    lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
});

export const quoteBlockCitation = style({
  margin: 0,
  color: vars.system.colors.textSecondary,
  fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
    fontSize: vars.system.textScale["tiny-caption"].fontSize,
    fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
    letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
    lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
});
