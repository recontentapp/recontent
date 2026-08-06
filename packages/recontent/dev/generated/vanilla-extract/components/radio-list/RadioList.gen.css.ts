import { style, styleVariants } from "@vanilla-extract/css";
import { refFontSizeScale } from "../../tokens.css";
import { vars } from "../../tokens.css";

export const radioListRoot = style({
  display: "flex",
  boxSizing: "border-box",
  gap: vars.ref.spacing[3],
});

export const radioListRootOrientation = styleVariants({
  horizontal: { flexDirection: "row", flexWrap: "wrap" },
  vertical: { flexDirection: "column" },
});

export const radioListOption = style({
  display: "flex",
  alignItems: "flex-start",
  boxSizing: "border-box",
  cursor: "pointer",
  gap: vars.ref.spacing[2],
  selectors: {
    "&[data-disabled]": {
      cursor: "not-allowed",
    },
  },
});

export const radioListControl = style({
  boxSizing: "border-box",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: "1rem",
  height: "1rem",
  marginTop: "0.125em",
  borderRadius: "50%",
  border: vars.system.border.default,
  backgroundColor: vars.system.colors.backgroundCard,
  ":hover": {
    borderColor: vars.system.colors.borderEmphasized,
  },
  ":focus-visible": {
    outline: `2px solid ${vars.system.colors.accent}`,
    outlineOffset: "2px",
  },
  selectors: {
    "&[data-checked]": {
      borderColor: vars.system.colors.accent,
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

export const radioListControlSize = styleVariants(refFontSizeScale, (value) => ({
  width: value,
  height: value,
}));

export const radioListIndicator = style({
  width: "50%",
  height: "50%",
  borderRadius: "50%",
  backgroundColor: vars.system.colors.accent,
  selectors: {
    "[data-disabled] &": {
      backgroundColor: vars.system.colors.textDisabled,
    },
  },
});

export const radioListContent = style({
  display: "flex",
  flexDirection: "column",
});

export const radioListLabel = style({
  color: vars.system.colors.textPrimary,
  fontFamily: vars.system.textStyles.body.fontFamily,
  fontSize: vars.system.textStyles.body.fontSize,
  fontWeight: vars.system.textStyles.body.fontWeight,
  letterSpacing: vars.system.textStyles.body.letterSpacing,
  lineHeight: vars.system.textStyles.body.lineHeight,
});

export const radioListDescription = style({
  color: vars.system.colors.textSecondary,
  fontFamily: vars.system.textScale.supporting.fontFamily,
  fontSize: vars.system.textScale.supporting.fontSize,
  fontWeight: vars.system.textScale.supporting.fontWeight,
  letterSpacing: vars.system.textScale.supporting.letterSpacing,
  lineHeight: vars.system.textScale.supporting.lineHeight,
});
