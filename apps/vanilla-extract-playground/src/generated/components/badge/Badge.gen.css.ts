import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const badgeRoot = style({
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  borderRadius: vars.ref.radius.full,
  whiteSpace: "nowrap",
});

export const badgeVariant = styleVariants({
  "info": {
      color: vars.system.colors.accent,
      backgroundColor: vars.system.colors.backgroundMuted,
      border: vars.system.border.default,
    },
  "success": {
      color: vars.ref.color.success[500],
      backgroundColor: vars.system.colors.backgroundMuted,
      border: vars.system.border.default,
    },
  "warning": {
      color: vars.ref.color.warning[500],
      backgroundColor: vars.system.colors.backgroundMuted,
      border: vars.system.border.default,
    },
  "danger": {
      color: vars.ref.color.danger[500],
      backgroundColor: vars.system.colors.backgroundMuted,
      border: vars.system.border.default,
    },
});

export const badgeSize = styleVariants({
  "sm": {
      paddingLeft: vars.ref.spacing[4],
      paddingRight: vars.ref.spacing[4],
      paddingTop: vars.ref.spacing[2],
      paddingBottom: vars.ref.spacing[2],
      gap: vars.ref.spacing[2],
      fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
      fontSize: vars.system.textScale["tiny-caption"].fontSize,
      fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
      letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
      lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
    },
  "md": {
      paddingLeft: vars.ref.spacing[8],
      paddingRight: vars.ref.spacing[8],
      paddingTop: vars.ref.spacing[4],
      paddingBottom: vars.ref.spacing[4],
      gap: vars.ref.spacing[4],
      fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
    },
});

export const badgeIconSize = styleVariants({
  "sm": { width: vars.ref.fontSize.xs, height: vars.ref.fontSize.xs },
  "md": { width: vars.ref.fontSize.sm, height: vars.ref.fontSize.sm },
});
