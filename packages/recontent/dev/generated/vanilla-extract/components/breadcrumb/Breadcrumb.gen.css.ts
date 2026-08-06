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
  gap: vars.ref.spacing[1],
});

export const breadcrumbItem = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.ref.spacing[1],
});

export const breadcrumbLink = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.25em",
  color: vars.system.colors.textSecondary,
  textDecoration: "none",
  fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
  ":hover": {
    color: vars.system.colors.textPrimary,
  },
});

export const breadcrumbCurrent = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.25em",
  color: vars.system.colors.textPrimary,
  fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
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
  ":hover": {
    color: vars.system.colors.textPrimary,
  },
});
