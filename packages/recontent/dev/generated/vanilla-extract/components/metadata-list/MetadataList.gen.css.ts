import { style, styleVariants } from "@vanilla-extract/css";
import { refSpacing } from "../../tokens.css";
import { vars } from "../../tokens.css";

export const metadataListRoot = style({
  display: "grid",
  margin: 0,
  boxSizing: "border-box",
  gridTemplateColumns: "repeat(var(--metadata-list-columns, 1), 1fr)",
});

export const metadataListGap = styleVariants(refSpacing, (value) => ({ gap: value }));

export const metadataListItem = style({
  boxSizing: "border-box",
  paddingBottom: "0.5rem",
  selectors: {
    "&:not(:last-child)": {
      borderBottom: vars.system.border.default,
    },
  },
});

export const metadataListItemHorizontal = style({
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: vars.ref.spacing[4],
});

export const metadataListItemVertical = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.ref.spacing[4],
});

export const metadataListLabelRow = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.ref.spacing[4],
});

export const metadataListLabel = style({
  margin: 0,
  color: vars.system.colors.textSecondary,
  fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
      fontSize: vars.system.textScale["tiny-caption"].fontSize,
      fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
      letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
      lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
});

export const metadataListValue = style({
  margin: 0,
  color: vars.system.colors.textPrimary,
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
});

export const metadataListIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  color: vars.system.colors.textSecondary,
  width: vars.ref.fontSize.sm,
  height: vars.ref.fontSize.sm,
});
