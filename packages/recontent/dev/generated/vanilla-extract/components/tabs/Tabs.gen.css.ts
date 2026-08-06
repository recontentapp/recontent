import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const tabsRoot = style({
  display: "flex",
  boxSizing: "border-box",
  selectors: {
    '&[data-orientation="vertical"]': {
      flexDirection: "row",
    },
    '&[data-orientation="horizontal"]': {
      flexDirection: "column",
    },
  },
});

export const tabsList = style({
  position: "relative",
  display: "flex",
  boxSizing: "border-box",
  gap: vars.ref.spacing[1],
  selectors: {
    '&[data-orientation="vertical"]': {
      flexDirection: "column",
    },
  },
});

export const tabsListVariant = styleVariants({
  "line": {
      backgroundColor: vars.system.colors.backgroundCard,
      border: vars.system.border.default,
      borderRadius: vars.ref.radius.none,
    },
  "pill": {
      backgroundColor: vars.system.colors.backgroundBody,
      border: vars.system.border.default,
      borderRadius: vars.ref.radius.full,
    },
});

export const tabsListFitted = style({
  selectors: {
    '&[data-orientation="horizontal"] > *': { flex: 1 },
  },
});

export const tabsTab = style({
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  border: "none",
  background: "none",
  zIndex: 1,
  gap: vars.ref.spacing[1],
  paddingLeft: vars.ref.spacing[3],
  paddingRight: vars.ref.spacing[3],
  paddingTop: vars.ref.spacing[2],
  paddingBottom: vars.ref.spacing[2],
  fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
  ":focus-visible": {
    outline: `2px solid ${vars.system.colors.accent}`,
    outlineOffset: "2px",
  },
  selectors: {
    "&[data-selected]": {
      fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
    },
    "&[data-disabled]": {
      color: vars.system.colors.textDisabled,
      cursor: "not-allowed",
    },
  },
});

export const tabsTabVariant = styleVariants({
  "line": {
      color: vars.system.colors.textSecondary,
      borderRadius: vars.ref.radius.none,
      ":hover": {
        color: vars.system.colors.textPrimary,
      },
      selectors: {
        "&[data-selected]": {
          color: vars.system.colors.textPrimary,
          backgroundColor: vars.system.colors.backgroundCard,
        },
      },
    },
  "pill": {
      color: vars.system.colors.textSecondary,
      borderRadius: vars.ref.radius.full,
      ":hover": {
        color: vars.system.colors.textPrimary,
      },
      selectors: {
        "&[data-selected]": {
          color: vars.system.colors.onAccent,
          backgroundColor: vars.system.colors.accent,
        },
      },
    },
});

export const tabsTabIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: vars.ref.fontSize.base,
  height: vars.ref.fontSize.base,
});

export const tabsIndicator = style({
  position: "absolute",
  transitionProperty: "translate, width, height",
  transitionDuration: "200ms",
  selectors: {
    '[data-orientation="horizontal"] &': {
      bottom: 0,
      height: vars.ref.spacing["0-5"],
      left: 0,
      width: "var(--active-tab-width)",
      translate: "var(--active-tab-left) 0",
    },
    '[data-orientation="vertical"] &': {
      right: 0,
      width: vars.ref.spacing["0-5"],
      top: 0,
      height: "var(--active-tab-height)",
      translate: "0 var(--active-tab-top)",
    },
  },
});

export const tabsIndicatorVariant = styleVariants({
  "line": { backgroundColor: vars.system.colors.accent },
  "pill": { backgroundColor: vars.system.colors.accent },
});

export const tabsPanel = style({
  boxSizing: "border-box",
  padding: vars.ref.spacing[4],
});
