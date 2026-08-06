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
  gap: vars.ref.spacing[1],
});

export const metadataListItemVertical = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.ref.spacing[1],
});

export const metadataListLabelRow = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.ref.spacing[1],
});

export const metadataListLabel = style({
  margin: 0,
  color: vars.system.colors.textSecondary,
  fontFamily: vars.system.textScale.supporting.fontFamily,
      fontSize: vars.system.textScale.supporting.fontSize,
      fontWeight: vars.system.textScale.supporting.fontWeight,
      letterSpacing: vars.system.textScale.supporting.letterSpacing,
      lineHeight: vars.system.textScale.supporting.lineHeight,
});

export const metadataListValue = style({
  margin: 0,
  color: vars.system.colors.textPrimary,
  fontFamily: vars.system.textStyles.body.fontFamily,
      fontSize: vars.system.textStyles.body.fontSize,
      fontWeight: vars.system.textStyles.body.fontWeight,
      letterSpacing: vars.system.textStyles.body.letterSpacing,
      lineHeight: vars.system.textStyles.body.lineHeight,
});

export const metadataListIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  color: vars.system.colors.textSecondary,
  width: vars.ref.fontSize.sm,
  height: vars.ref.fontSize.sm,
});
