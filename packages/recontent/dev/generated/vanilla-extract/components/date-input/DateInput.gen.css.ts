import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const dateInputRoot = style({
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  width: "100%",
  gap: vars.ref.spacing[8],
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  backgroundColor: vars.system.colors.backgroundCard,
  paddingLeft: vars.ref.spacing[12],
  paddingRight: vars.ref.spacing[12],
  ":hover": {
    borderColor: vars.system.colors.borderEmphasized,
  },
  ":focus-within": {
    borderColor: vars.system.colors.accent,
  },
  selectors: {
    "&[data-invalid]": {
      borderColor: vars.ref.color.danger[500],
    },
    "&[data-readonly]": {
      backgroundColor: vars.system.colors.backgroundBody,
    },
    "&[data-disabled]": {
      backgroundColor: vars.system.colors.backgroundMuted,
      color: vars.system.colors.textDisabled,
      cursor: "not-allowed",
    },
    "&:has(:focus-visible)": {
    outline: "none",
    boxShadow: `0 0 0 2px ${vars.system.colors.accent}`,
  },
  },
});

export const dateInputField = style({
  flex: 1,
  minWidth: 0,
  boxSizing: "border-box",
  border: "none",
  outline: "none",
  background: "none",
  cursor: "pointer",
  color: vars.system.colors.textPrimary,
  paddingTop: vars.ref.spacing[8],
  paddingBottom: vars.ref.spacing[8],
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
  "::placeholder": {
    color: vars.system.colors.textSecondary,
  },
  ":disabled": {
    cursor: "not-allowed",
  },
  selectors: {
    [`${dateInputRoot}[data-readonly] &`]: {
      cursor: "default",
    },
  },
});

export const dateInputIconButton = style({
  display: "inline-flex",
  flexShrink: 0,
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: vars.system.colors.textSecondary,
});

export const dateInputIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: vars.ref.fontSize.base,
  height: vars.ref.fontSize.base,
});

export const dateInputPositioner = style({
  outline: "none",
  zIndex: 50,
  selectors: {
    '&[data-side="top"]': { marginBottom: vars.ref.spacing[2] },
    '&[data-side="bottom"]': { marginTop: vars.ref.spacing[2] },
  },
});

export const dateInputPopup = style({
  boxSizing: "border-box",
  backgroundColor: vars.system.colors.backgroundCard,
  border: vars.system.border.default,
  borderRadius: vars.ref.radius.element,
  boxShadow: vars.system.elevationScale.md,
  padding: vars.ref.spacing[12],
  outline: "none",
});

export const dateInputHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: vars.ref.spacing[12],
});

export const dateInputNavButton = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  outline: "none",
  border: "none",
  background: "none",
  padding: 0,
  color: vars.system.colors.textSecondary,
  ":focus-visible": {
    outline: "none",
    boxShadow: `0 0 0 2px ${vars.system.colors.accent}`,
  },
  selectors: {
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
});

export const dateInputMonths = style({
  display: "flex",
  flexDirection: "column",
});

export const dateInputMonthLabel = style({
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
  color: vars.system.colors.textPrimary,
  textAlign: "center",
});

export const dateInputGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "0.125rem",
  borderCollapse: "collapse",
});

/**
 * react-day-picker renders `month_grid` as a `<table>`, with a `<thead>`
 * wrapping the weekday `<tr>` and a `<tbody>` wrapping the week `<tr>`s.
 * All of `thead`, `tbody` and `tr` must become transparent to CSS Grid via
 * `display: contents` for the `<td>`/`<th>` cells to flow as direct grid
 * items of `dateInputGrid`; otherwise the browser generates an anonymous
 * table around `thead`/`tbody` (since they keep their table-group display)
 * and lays out each row as its own independent table, ignoring the grid.
 */
export const dateInputRow = style({
  display: "contents",
});

export const dateInputRowGroup = style({
  display: "contents",
});

export const dateInputWeekday = style({
  textAlign: "center",
  color: vars.system.colors.textSecondary,
  fontFamily: vars.system.textScale["tiny-caption"].fontFamily,
      fontSize: vars.system.textScale["tiny-caption"].fontSize,
      fontWeight: vars.system.textScale["tiny-caption"].fontWeight,
      letterSpacing: vars.system.textScale["tiny-caption"].letterSpacing,
      lineHeight: vars.system.textScale["tiny-caption"].lineHeight,
});

/** Marker classes applied by react-day-picker's `classNames` to the day cell; styled on the button via a descendant selector below. */
export const dateInputDaySelected = style({});
export const dateInputDayToday = style({});
export const dateInputDayOutside = style({});
export const dateInputDayDisabled = style({});

export const dateInputDay = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  width: "100%",
  aspectRatio: "1",
  cursor: "pointer",
  outline: "none",
  border: "1px solid transparent",
  borderRadius: vars.ref.radius.inner,
  color: vars.system.colors.textPrimary,
  backgroundColor: "transparent",
  fontFamily: vars.system.textScale["paragraph-body-m"].fontFamily,
      fontSize: vars.system.textScale["paragraph-body-m"].fontSize,
      fontWeight: vars.system.textScale["paragraph-body-m"].fontWeight,
      letterSpacing: vars.system.textScale["paragraph-body-m"].letterSpacing,
      lineHeight: vars.system.textScale["paragraph-body-m"].lineHeight,
  ":hover": {
    backgroundColor: vars.system.colors.backgroundBody,
  },
  selectors: {
    [`.${dateInputDayOutside} &`]: {
      color: vars.system.colors.textDisabled,
    },
    [`.${dateInputDayToday} &`]: {
      borderColor: vars.system.colors.accent,
    },
    [`.${dateInputDaySelected} &`]: {
      backgroundColor: vars.system.colors.accent,
      color: vars.system.colors.onAccent,
    },
    [`.${dateInputDayDisabled} &`]: {
      color: vars.system.colors.textDisabled,
      cursor: "not-allowed",
    },
  },
});

