import { style, styleVariants } from "@vanilla-extract/css";
import { systemSpacing } from "../../tokens.css";

export const gridRoot = style({ display: "grid" });

export const gridColumns = style({
  gridTemplateColumns: "var(--rc-grid-columns-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      gridTemplateColumns: "var(--rc-grid-columns-md, var(--rc-grid-columns-base))",
    },
    "screen and (min-width: 80rem)": {
      gridTemplateColumns: "var(--rc-grid-columns-lg, var(--rc-grid-columns-md, var(--rc-grid-columns-base)))",
    },
  }
});

export const gridRows = style({
  gridTemplateRows: "var(--rc-grid-rows-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      gridTemplateRows: "var(--rc-grid-rows-md, var(--rc-grid-rows-base))",
    },
    "screen and (min-width: 80rem)": {
      gridTemplateRows: "var(--rc-grid-rows-lg, var(--rc-grid-rows-md, var(--rc-grid-rows-base)))",
    },
  }
});

export const gridGap = style({
  gap: "var(--rc-grid-gap-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      gap: "var(--rc-grid-gap-md, var(--rc-grid-gap-base))",
    },
    "screen and (min-width: 80rem)": {
      gap: "var(--rc-grid-gap-lg, var(--rc-grid-gap-md, var(--rc-grid-gap-base)))",
    },
  }
});

export const gridColumnGap = style({
  columnGap: "var(--rc-grid-column-gap-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      columnGap: "var(--rc-grid-column-gap-md, var(--rc-grid-column-gap-base))",
    },
    "screen and (min-width: 80rem)": {
      columnGap: "var(--rc-grid-column-gap-lg, var(--rc-grid-column-gap-md, var(--rc-grid-column-gap-base)))",
    },
  }
});

export const gridRowGap = style({
  rowGap: "var(--rc-grid-row-gap-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      rowGap: "var(--rc-grid-row-gap-md, var(--rc-grid-row-gap-base))",
    },
    "screen and (min-width: 80rem)": {
      rowGap: "var(--rc-grid-row-gap-lg, var(--rc-grid-row-gap-md, var(--rc-grid-row-gap-base)))",
    },
  }
});

export const gridAlign = styleVariants({
  start: { alignItems: "start" },
  center: { alignItems: "center" },
  end: { alignItems: "end" },
  stretch: { alignItems: "stretch" },
});

export const gridJustify = styleVariants({
  start: { justifyItems: "start" },
  center: { justifyItems: "center" },
  end: { justifyItems: "end" },
  stretch: { justifyItems: "stretch" },
  "space-between": { justifyContent: "space-between" },
});

export const gridAutoFlow = styleVariants({
  row: { gridAutoFlow: "row" },
  column: { gridAutoFlow: "column" },
  dense: { gridAutoFlow: "dense" },
  "row dense": { gridAutoFlow: "row dense" },
  "column dense": { gridAutoFlow: "column dense" },
});
