import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const selectTrigger = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxSizing: "border-box",
  width: "100%",
  cursor: "pointer",
  gap: vars.ref.fontSize.base,
  color: vars.system.colors.textPrimary,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  backgroundColor: vars.system.colors.backgroundCard,
  paddingLeft: vars.ref.spacing[12],
  paddingRight: vars.ref.spacing[12],
  paddingTop: vars.ref.spacing[8],
  paddingBottom: vars.ref.spacing[8],
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
  ":hover": {
    borderColor: vars.system.colors.borderEmphasized,
  },
  ":focus-visible": {
    outline: `2px solid ${vars.system.colors.accent}`,
    outlineOffset: "2px",
  },
  selectors: {
    "&[data-popup-open]": {
      borderColor: vars.system.colors.accent,
    },
    "&[data-invalid]": {
      borderColor: vars.ref.color.danger[500],
    },
    "&[data-disabled]": {
      backgroundColor: vars.system.colors.backgroundMuted,
      color: vars.system.colors.textDisabled,
      cursor: "not-allowed",
    },
  },
});

export const selectValue = style({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const selectPlaceholder = style({
  color: vars.system.colors.textSecondary,
});

export const selectTriggerIcons = style({
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
  gap: vars.ref.fontSize.base,
});

export const selectIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: vars.ref.fontSize.base,
  height: vars.ref.fontSize.base,
});

export const selectClear = style({
  display: "inline-flex",
  flexShrink: 0,
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: "inherit",
});

export const selectPositioner = style({
  outline: "none",
  zIndex: 50,
  selectors: {
    '&[data-side="top"]': { marginBottom: vars.ref.spacing[2] },
    '&[data-side="bottom"]': { marginTop: vars.ref.spacing[2] },
    '&[data-side="left"]': { marginRight: vars.ref.spacing[2] },
    '&[data-side="right"]': { marginLeft: vars.ref.spacing[2] },
  },
});

export const selectPopup = style({
  boxSizing: "border-box",
  backgroundColor: vars.system.colors.backgroundCard,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  boxShadow: vars.system.elevationScale.md,
  padding: vars.ref.spacing[4],
  outline: "none",
  maxHeight: "min(24rem, var(--available-height))",
  overflowY: "auto",
});

export const selectItem = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxSizing: "border-box",
  cursor: "pointer",
  gap: vars.ref.fontSize.base,
  color: vars.system.colors.textPrimary,
  paddingLeft: vars.ref.spacing[8],
  paddingRight: vars.ref.spacing[8],
  paddingTop: vars.ref.spacing[8],
  paddingBottom: vars.ref.spacing[8],
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
  selectors: {
    "&[data-highlighted]": {
      backgroundColor: vars.system.colors.backgroundBody,
    },
    "&[data-selected]": {
      backgroundColor: vars.system.colors.backgroundMuted,
      color: vars.system.colors.accent,
    },
    "&[data-disabled]": {
      color: vars.system.colors.textDisabled,
      cursor: "not-allowed",
    },
  },
});

export const selectItemStart = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.ref.fontSize.base,
  overflow: "hidden",
});
