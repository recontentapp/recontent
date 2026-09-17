import { style, styleVariants } from "@vanilla-extract/css";
import { refIconScale } from "../../tokens.css";
import { vars } from "../../tokens.css";

export const radioListRoot = style({
  display: "flex",
  boxSizing: "border-box",
  gap: vars.ref.spacing[12],
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
  gap: vars.ref.spacing[8],
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
    outline: "none",
    boxShadow: `0 0 0 2px ${vars.system.colors.accent}`,
  },
  selectors: {
    "&[data-checked]": {
      borderColor: vars.system.colors.accent,
    },
    "&[data-invalid]": {
      borderColor: vars.ref.color.danger[500],
    },
    "&[data-disabled]": {
      backgroundColor: vars.system.colors.backgroundMuted,
      cursor: "not-allowed",
    },
  },
});

export const radioListControlSize = styleVariants(refIconScale, (value) => ({
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
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
  fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
  fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
  letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
  lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
});

export const radioListDescription = style({
  color: vars.system.colors.textSecondary,
  fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
  fontSize: vars.system.textScale["tiny-caption"].fontSize,
  fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
  letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
  lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
});
