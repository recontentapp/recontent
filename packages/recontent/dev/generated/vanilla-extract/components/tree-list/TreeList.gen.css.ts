import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const treeListRoot = style({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  margin: 0,
  padding: 0,
});

export const treeListGroup = style({
  display: "flex",
  flexDirection: "column",
  listStyle: "none",
  margin: 0,
  padding: 0,
  position: "relative",
  selectors: {
    "&:not([data-depth=\"0\"])": {
      borderLeft: `1px solid vars.system.colors.border`,
      marginLeft: vars.ref.spacing[12],
    },
  },
});

export const treeListRow = style({
  display: "flex",
  alignItems: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  color: vars.system.colors.textPrimary,
  borderRadius: vars.ref.radius.inner,
  gap: vars.ref.spacing[4],
  paddingLeft: vars.ref.spacing[8],
  paddingRight: vars.ref.spacing[8],
  paddingTop: vars.ref.spacing[8],
  paddingBottom: vars.ref.spacing[8],
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
  ":hover": {
    backgroundColor: vars.system.colors.backgroundBody,
  },
  ":focus-visible": {
    outline: "none",
    boxShadow: `inset 0 0 0 2px ${vars.system.colors.accent}`,
  },
  selectors: {
    "&[data-selected]": {
      backgroundColor: vars.system.colors.backgroundMuted,
      color: vars.system.colors.accent,
    },
    "&[data-disabled]": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
});

export const treeListExpand = style({
  display: "inline-flex",
  flexShrink: 0,
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  background: "none",
  padding: 0,
  cursor: "pointer",
  color: "inherit",
  width: vars.ref.fontSize.base,
  height: vars.ref.fontSize.base,
  transitionProperty: "transform",
  ":focus-visible": {
    outline: "none",
    boxShadow: `0 0 0 2px ${vars.system.colors.accent}`,
  },
  selectors: {
    "&[data-expanded]": {
      transform: "rotate(0deg)",
    },
    "&:not([data-expanded])": {
      transform: "rotate(-90deg)",
    },
  },
});

export const treeListExpandSpacer = style({
  display: "inline-block",
  flexShrink: 0,
  width: vars.ref.fontSize.base,
  height: vars.ref.fontSize.base,
});

export const treeListIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  color: vars.system.colors.textSecondary,
  width: vars.ref.fontSize.base,
  height: vars.ref.fontSize.base,
});

export const treeListLabel = style({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});
