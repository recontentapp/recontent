import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const iconButtonRoot = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  boxSizing: "border-box",
  cursor: "pointer",
  borderRadius: vars.ref.radius.element,
  ":focus-visible": {
    outline: `2px solid ${vars.system.colors.accent}`,
    outlineOffset: "2px",
  },
});

export const iconButtonLoading = style({
  cursor: "wait",
  opacity: 0.7,
});

export const iconButtonVariant = styleVariants({
  "primary": {
      backgroundColor: vars.system.colors.accent,
      color: vars.system.colors.onAccent,
      border: vars.system.border.default,
      fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
      ":hover": {
        backgroundColor: vars.ref.color.blue500,
        color: vars.system.colors.onAccent,
        border: vars.system.border.default,
      },
      ":disabled": {
        backgroundColor: vars.system.colors.backgroundMuted,
        color: vars.system.colors.textDisabled,
        border: vars.system.border.default,
        cursor: "not-allowed",
      },
    },
  "secondary": {
      backgroundColor: vars.system.colors.backgroundCard,
      color: vars.system.colors.textPrimary,
      border: vars.system.border.default,
      fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
      ":hover": {
        backgroundColor: vars.system.colors.backgroundBody,
        color: vars.system.colors.textPrimary,
        border: vars.system.border.default,
      },
      ":disabled": {
        backgroundColor: vars.system.colors.backgroundMuted,
        color: vars.system.colors.textDisabled,
        border: vars.system.border.default,
        cursor: "not-allowed",
      },
    },
});

export const iconButtonSize = styleVariants({
  "sm": {
      width: `calc(vars.ref.fontSize.sm + 2 * vars.ref.spacing[1])`,
      height: `calc(vars.ref.fontSize.sm + 2 * vars.ref.spacing[1])`,
    },
  "md": {
      width: `calc(vars.ref.fontSize.base + 2 * vars.ref.spacing["1-5"])`,
      height: `calc(vars.ref.fontSize.base + 2 * vars.ref.spacing["1-5"])`,
    },
});

export const iconButtonIconSize = styleVariants({
  "sm": {
      width: vars.ref.fontSize.sm,
      height: vars.ref.fontSize.sm,
    },
  "md": {
      width: vars.ref.fontSize.base,
      height: vars.ref.fontSize.base,
    },
});
