import { style, styleVariants } from "@vanilla-extract/css";
import { refFontSizeScale } from "../../tokens.css";
import { vars } from "../../tokens.css";

export const checkboxRoot = style({
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  gap: vars.ref.spacing[2],
  selectors: {
    "&[data-disabled]": {
      cursor: "not-allowed",
    },
  },
});

export const checkboxBox = style({
  boxSizing: "border-box",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: "1rem",
  height: "1rem",
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.inner,
  backgroundColor: vars.system.colors.backgroundCard,
  ":hover": {
    borderColor: vars.system.colors.borderEmphasized,
  },
  ":focus-visible": {
    outline: `2px solid ${vars.system.colors.accent}`,
    outlineOffset: "2px",
  },
  selectors: {
    "&[data-checked], &[data-indeterminate]": {
      backgroundColor: vars.system.colors.accent,
    },
    "&[data-invalid]": {
      borderColor: vars.ref.color.error,
    },
    "&[data-disabled]": {
      backgroundColor: vars.system.colors.backgroundMuted,
      cursor: "not-allowed",
    },
  },
});

export const checkboxSize = styleVariants(refFontSizeScale, (value) => ({
  width: value,
  height: value,
}));

export const checkboxIndicator = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  color: vars.system.colors.onAccent,
  selectors: {
    "[data-disabled] &": {
      color: vars.system.colors.textDisabled,
    },
  },
});

export const checkboxLabel = style({
  color: vars.system.colors.textPrimary,
  fontFamily: vars.system.textStyles.body.fontFamily,
  fontSize: vars.system.textStyles.body.fontSize,
  fontWeight: vars.system.textStyles.body.fontWeight,
  letterSpacing: vars.system.textStyles.body.letterSpacing,
  lineHeight: vars.system.textStyles.body.lineHeight,
});
