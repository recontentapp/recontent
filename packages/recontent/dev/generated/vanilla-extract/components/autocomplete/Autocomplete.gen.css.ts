import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const autocompleteTrigger = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  boxSizing: "border-box",
  width: "100%",
  gap: vars.ref.spacing["0-5"],
  color: vars.system.colors.textPrimary,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  backgroundColor: vars.system.colors.backgroundCard,
  paddingLeft: vars.ref.spacing[3],
  paddingRight: vars.ref.spacing[3],
  paddingTop: vars.ref.spacing[2],
  paddingBottom: vars.ref.spacing[2],
  ":hover": {
    borderColor: vars.system.colors.borderEmphasized,
  },
  ":focus-within": {
    borderColor: vars.system.colors.accent,
    outline: `2px solid ${vars.system.colors.accent}`,
    outlineOffset: "2px",
  },
  selectors: {
    "&[data-invalid]": {
      borderColor: vars.ref.color.error,
    },
    "&[data-disabled]": {
      backgroundColor: vars.system.colors.backgroundMuted,
      color: vars.system.colors.textDisabled,
      cursor: "not-allowed",
    },
  },
});

export const autocompleteInput = style({
  flex: 1,
  minWidth: "4rem",
  border: "none",
  outline: "none",
  background: "none",
  color: "inherit",
  fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
  "::placeholder": {
    color: vars.system.colors.textSecondary,
  },
});

export const autocompleteChips = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: vars.ref.spacing["0-5"],
});

export const autocompleteChip = style({
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  gap: vars.ref.spacing["0-5"],
  color: vars.system.colors.textPrimary,
  backgroundColor: vars.system.colors.backgroundMuted,
  borderRadius: vars.ref.radius.inner,
  paddingLeft: vars.ref.spacing[2],
  paddingRight: vars.ref.spacing[2],
  fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
});

export const autocompleteChipRemove = style({
  display: "inline-flex",
  alignItems: "center",
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: "inherit",
});

export const autocompleteTriggerIcons = style({
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
  gap: vars.ref.fontSize.base,
});

export const autocompleteIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: vars.ref.fontSize.base,
  height: vars.ref.fontSize.base,
});

export const autocompleteClear = style({
  display: "inline-flex",
  flexShrink: 0,
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: "inherit",
});

export const autocompletePositioner = style({
  outline: "none",
  zIndex: 50,
  selectors: {
    '&[data-side="top"]': { marginBottom: vars.ref.spacing["0-5"] },
    '&[data-side="bottom"]': { marginTop: vars.ref.spacing["0-5"] },
    '&[data-side="left"]': { marginRight: vars.ref.spacing["0-5"] },
    '&[data-side="right"]': { marginLeft: vars.ref.spacing["0-5"] },
  },
});

export const autocompletePopup = style({
  boxSizing: "border-box",
  backgroundColor: vars.system.colors.backgroundCard,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  boxShadow: vars.system.elevation.md,
  padding: vars.ref.spacing[1],
  outline: "none",
  maxHeight: "min(24rem, var(--available-height))",
  overflowY: "auto",
});

export const autocompleteItem = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxSizing: "border-box",
  cursor: "pointer",
  gap: vars.ref.fontSize.base,
  color: vars.system.colors.textPrimary,
  paddingLeft: vars.ref.spacing[2],
  paddingRight: vars.ref.spacing[2],
  paddingTop: vars.ref.spacing["1-5"],
  paddingBottom: vars.ref.spacing["1-5"],
  fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
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

export const autocompleteItemStart = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.ref.fontSize.base,
  overflow: "hidden",
});

export const autocompleteHighlight = style({
  backgroundColor: vars.ref.color.purpleMuted,
});

export const autocompleteEmpty = style({
  boxSizing: "border-box",
  color: vars.system.colors.textSecondary,
  padding: vars.ref.spacing[3],
  fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
});
