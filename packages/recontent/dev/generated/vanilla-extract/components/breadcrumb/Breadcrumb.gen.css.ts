import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const breadcrumbList = style({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  listStyle: "none",
  margin: 0,
  padding: 0,
  boxSizing: "border-box",
  gap: vars.ref.spacing[4],
});

export const breadcrumbItem = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.ref.spacing[4],
});

export const breadcrumbLink = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.25em",
  color: vars.system.colors.textSecondary,
  textDecoration: "none",
  transitionProperty: "color",
  transitionDuration: "150ms",
  transitionTimingFunction: "ease",
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
});

export const breadcrumbCurrent = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.25em",
  color: vars.system.colors.textPrimary,
  fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
      fontSize: vars.system.textScale["tiny-caption"].fontSize,
      fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
      letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
      lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
});

export const breadcrumbIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: vars.ref.fontSize.sm,
  height: vars.ref.fontSize.sm,
});

export const breadcrumbSeparator = style({
  display: "inline-flex",
  flexShrink: 0,
  color: vars.system.colors.textDisabled,
  width: vars.ref.fontSize.sm,
  height: vars.ref.fontSize.sm,
  transform: "rotate(-90deg)",
});

export const breadcrumbOverflow = style({
  display: "inline-flex",
  alignItems: "center",
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: vars.system.colors.textSecondary,
  transitionProperty: "color",
  transitionDuration: "150ms",
  transitionTimingFunction: "ease",
  ":hover": {
    color: vars.system.colors.textPrimary,
  },
  ":focus-visible": {
    outline: "none",
    boxShadow: `0 0 0 2px ${vars.system.colors.accent}`,
  },
});
