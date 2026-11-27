import { style } from "@vanilla-extract/css";
import { systemVars } from "./generated/tokens.css";

export const page = style({
  backgroundColor: systemVars.colors.backgroundBody,
  color: systemVars.colors.textPrimary,
  fontFamily: systemVars.typography.bodyFontFamily,
  minHeight: "100vh",
  padding: systemVars.spacing[48],
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  transition: `background-color ${systemVars.motion.fast} ${systemVars.motion.standard}, color ${systemVars.motion.fast} ${systemVars.motion.standard}`,
});

export const panel = style({
  backgroundColor: systemVars.colors.backgroundCard,
  border: systemVars.border.default,
  borderRadius: systemVars.radius.page,
  boxShadow: systemVars.elevationScale.md,
  display: "flex",
  flexDirection: "column",
  gap: systemVars.spacing[24],
  maxWidth: "680px",
  width: "100%",
  padding: systemVars.spacing[32],
});

export const header = style({
  display: "flex",
  flexDirection: "column",
  gap: systemVars.spacing[8],
});

export const eyebrowRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: systemVars.spacing[12],
});

export const eyebrow = style({
  color: systemVars.colors.textSecondary,
  fontSize: systemVars.textScale["tiny-caption-strong"].fontSize,
  fontWeight: systemVars.textScale["tiny-caption-strong"].fontWeight,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
});

export const title = style({
  fontSize: systemVars.textScale["heading-branding-page"].fontSize,
  fontWeight: systemVars.textScale["heading-branding-page"].fontWeight,
  lineHeight: systemVars.textScale["heading-branding-page"].lineHeight,
  margin: 0,
});

export const copy = style({
  color: systemVars.colors.textSecondary,
  fontSize: systemVars.textScale["paragraph-body-m"].fontSize,
  lineHeight: systemVars.textScale["paragraph-body-m"].lineHeight,
  margin: 0,
});

export const code = style({
  fontFamily: systemVars.typography.codeFontFamily,
  backgroundColor: systemVars.colors.backgroundMuted,
  border: systemVars.border.default,
  borderRadius: systemVars.radius.inner,
  paddingInline: systemVars.spacing[4],
  paddingBlock: systemVars.spacing[2],
  color: systemVars.colors.textPrimary,
});

export const controls = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: systemVars.spacing[12],
  padding: systemVars.spacing[16],
  backgroundColor: systemVars.colors.backgroundMuted,
  borderRadius: systemVars.radius.container,
  border: systemVars.border.default,
});

export const axisGroup = style({
  display: "flex",
  flexDirection: "column",
  gap: systemVars.spacing[8],
});

export const axisLabel = style({
  color: systemVars.colors.textSecondary,
  fontSize: systemVars.textScale["tiny-caption-strong"].fontSize,
  fontWeight: systemVars.textScale["tiny-caption-strong"].fontWeight,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
});

export const pillRow = style({
  display: "flex",
  flexWrap: "wrap",
  gap: systemVars.spacing[4],
});

export const pill = style({
  border: systemVars.border.default,
  borderRadius: systemVars.radius.element,
  paddingInline: systemVars.spacing[8],
  paddingBlock: systemVars.spacing[4],
  backgroundColor: systemVars.colors.backgroundSurface,
  color: systemVars.colors.textSecondary,
  fontFamily: systemVars.typography.bodyFontFamily,
  fontSize: systemVars.textScale.clickable.fontSize,
  fontWeight: systemVars.textScale.clickable.fontWeight,
  cursor: "pointer",
  selectors: {
    '&[aria-pressed="true"]': {
      backgroundColor: systemVars.colors.accent,
      color: systemVars.colors.onAccent,
      borderColor: "transparent",
    },
  },
});

export const showcase = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: systemVars.spacing[16],
});

export const banner = style({
  backgroundImage: systemVars.gradients.accent,
  color: systemVars.colors.onAccent,
  borderRadius: systemVars.radius.container,
  padding: systemVars.spacing[20],
  display: "flex",
  flexDirection: "column",
  gap: systemVars.spacing[8],
});

export const card = style({
  backgroundColor: systemVars.colors.backgroundSurface,
  border: systemVars.border.default,
  borderRadius: systemVars.radius.container,
  boxShadow: systemVars.elevationScale.sm,
  padding: systemVars.spacing[20],
  display: "flex",
  flexDirection: "column",
  gap: systemVars.spacing[8],
});

export const cardHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: systemVars.spacing[8],
});

export const cardTitle = style({
  fontSize: systemVars.textScale["heading-section-3"].fontSize,
  fontWeight: systemVars.textScale["heading-section-3"].fontWeight,
  lineHeight: systemVars.textScale["heading-section-3"].lineHeight,
  margin: 0,
});

export const cardMeta = style({
  fontSize: systemVars.textScale["tiny-caption"].fontSize,
  lineHeight: systemVars.textScale["tiny-caption"].lineHeight,
  opacity: 0.9,
  margin: 0,
});
