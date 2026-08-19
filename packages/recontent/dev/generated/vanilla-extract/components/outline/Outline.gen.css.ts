import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const outlineRoot = style({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  borderLeft: vars.system.border.default,
});

export const outlineList = style({
  display: "flex",
  flexDirection: "column",
  margin: 0,
  padding: 0,
  listStyle: "none",
});

export const outlineItem = style({
  position: "relative",
});

export const outlineLink = style({
  display: "block",
  boxSizing: "border-box",
  textDecoration: "none",
  color: vars.system.colors.textSecondary,
  paddingLeft: vars.ref.spacing[12],
  paddingRight: vars.ref.spacing[12],
  paddingTop: vars.ref.spacing[2],
  paddingBottom: vars.ref.spacing[2],
  fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
      fontSize: vars.system.textScale["tiny-caption"].fontSize,
      fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
      letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
      lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
  ":hover": {
    color: vars.system.colors.textPrimary,
  },
  ":focus-visible": {
    outline: "none",
    boxShadow: `0 0 0 2px ${vars.system.colors.accent}`,
  },
  selectors: {
    "&[data-active]": {
      color: vars.system.colors.accent,
      fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
      fontSize: vars.system.textScale["tiny-caption"].fontSize,
      fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
      letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
      lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
    },
    "&[data-active]::before": {
      content: '""',
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: "2px",
      backgroundColor: vars.system.colors.accent,
    },
  },
});

export const outlineIndent = style({
  paddingLeft: vars.ref.spacing[12],
});
