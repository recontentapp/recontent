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
      color: vars.ref.color.success,
      backgroundColor: vars.system.colors.backgroundMuted,
      border: vars.system.border.default,
    },
  "warning": {
      color: vars.ref.color.warning,
      backgroundColor: vars.system.colors.backgroundMuted,
      border: vars.system.border.default,
    },
  "danger": {
      color: vars.ref.color.error,
      backgroundColor: vars.system.colors.backgroundMuted,
      border: vars.system.border.default,
    },
});

export const badgeDotColor = styleVariants({
  "info": { backgroundColor: vars.system.colors.accent },
  "success": { backgroundColor: vars.ref.color.success },
  "warning": { backgroundColor: vars.ref.color.warning },
  "danger": { backgroundColor: vars.ref.color.error },
});

export const badgeSize = styleVariants({
  "sm": {
      paddingLeft: vars.ref.spacing[1],
      paddingRight: vars.ref.spacing[1],
      paddingTop: vars.ref.spacing["0-5"],
      paddingBottom: vars.ref.spacing["0-5"],
      gap: vars.ref.spacing["0-5"],
      fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
    },
  "md": {
      paddingLeft: vars.ref.spacing["1-5"],
      paddingRight: vars.ref.spacing["1-5"],
      paddingTop: vars.ref.spacing[1],
      paddingBottom: vars.ref.spacing[1],
      gap: vars.ref.spacing[1],
      fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
    },
});

export const badgeIconSize = styleVariants({
  "sm": { width: vars.ref.fontSize.xs, height: vars.ref.fontSize.xs },
  "md": { width: vars.ref.fontSize.sm, height: vars.ref.fontSize.sm },
});

export const badgeDot = style({
  flexShrink: 0,
  borderRadius: "50%",
  width: vars.ref.spacing["1-5"],
  height: vars.ref.spacing["1-5"],
});
