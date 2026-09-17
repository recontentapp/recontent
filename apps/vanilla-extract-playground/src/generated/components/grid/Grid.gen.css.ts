import { style, styleVariants } from "@vanilla-extract/css";
import { systemSpacing } from "../../tokens.css";

export const gridRoot = style({ display: "grid" });

export const gridColumns = style({
  gridTemplateColumns: "var(--rc-grid-columns-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      gridTemplateColumns: "var(--rc-grid-columns-sm, var(--rc-grid-columns-xs))",
    },
    "screen and (min-width: 768px)": {
      gridTemplateColumns: "var(--rc-grid-columns-md, var(--rc-grid-columns-sm, var(--rc-grid-columns-xs)))",
    },
    "screen and (min-width: 992px)": {
      gridTemplateColumns: "var(--rc-grid-columns-lg, var(--rc-grid-columns-md, var(--rc-grid-columns-sm, var(--rc-grid-columns-xs))))",
    },
    "screen and (min-width: 1200px)": {
      gridTemplateColumns: "var(--rc-grid-columns-xl, var(--rc-grid-columns-lg, var(--rc-grid-columns-md, var(--rc-grid-columns-sm, var(--rc-grid-columns-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      gridTemplateColumns: "var(--rc-grid-columns-xxl, var(--rc-grid-columns-xl, var(--rc-grid-columns-lg, var(--rc-grid-columns-md, var(--rc-grid-columns-sm, var(--rc-grid-columns-xs))))))",
    },
  }
});

export const gridRows = style({
  gridTemplateRows: "var(--rc-grid-rows-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      gridTemplateRows: "var(--rc-grid-rows-sm, var(--rc-grid-rows-xs))",
    },
    "screen and (min-width: 768px)": {
      gridTemplateRows: "var(--rc-grid-rows-md, var(--rc-grid-rows-sm, var(--rc-grid-rows-xs)))",
    },
    "screen and (min-width: 992px)": {
      gridTemplateRows: "var(--rc-grid-rows-lg, var(--rc-grid-rows-md, var(--rc-grid-rows-sm, var(--rc-grid-rows-xs))))",
    },
    "screen and (min-width: 1200px)": {
      gridTemplateRows: "var(--rc-grid-rows-xl, var(--rc-grid-rows-lg, var(--rc-grid-rows-md, var(--rc-grid-rows-sm, var(--rc-grid-rows-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      gridTemplateRows: "var(--rc-grid-rows-xxl, var(--rc-grid-rows-xl, var(--rc-grid-rows-lg, var(--rc-grid-rows-md, var(--rc-grid-rows-sm, var(--rc-grid-rows-xs))))))",
    },
  }
});

export const gridGap = style({
  gap: "var(--rc-grid-gap-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      gap: "var(--rc-grid-gap-sm, var(--rc-grid-gap-xs))",
    },
    "screen and (min-width: 768px)": {
      gap: "var(--rc-grid-gap-md, var(--rc-grid-gap-sm, var(--rc-grid-gap-xs)))",
    },
    "screen and (min-width: 992px)": {
      gap: "var(--rc-grid-gap-lg, var(--rc-grid-gap-md, var(--rc-grid-gap-sm, var(--rc-grid-gap-xs))))",
    },
    "screen and (min-width: 1200px)": {
      gap: "var(--rc-grid-gap-xl, var(--rc-grid-gap-lg, var(--rc-grid-gap-md, var(--rc-grid-gap-sm, var(--rc-grid-gap-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      gap: "var(--rc-grid-gap-xxl, var(--rc-grid-gap-xl, var(--rc-grid-gap-lg, var(--rc-grid-gap-md, var(--rc-grid-gap-sm, var(--rc-grid-gap-xs))))))",
    },
  }
});

export const gridColumnGap = style({
  columnGap: "var(--rc-grid-column-gap-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      columnGap: "var(--rc-grid-column-gap-sm, var(--rc-grid-column-gap-xs))",
    },
    "screen and (min-width: 768px)": {
      columnGap: "var(--rc-grid-column-gap-md, var(--rc-grid-column-gap-sm, var(--rc-grid-column-gap-xs)))",
    },
    "screen and (min-width: 992px)": {
      columnGap: "var(--rc-grid-column-gap-lg, var(--rc-grid-column-gap-md, var(--rc-grid-column-gap-sm, var(--rc-grid-column-gap-xs))))",
    },
    "screen and (min-width: 1200px)": {
      columnGap: "var(--rc-grid-column-gap-xl, var(--rc-grid-column-gap-lg, var(--rc-grid-column-gap-md, var(--rc-grid-column-gap-sm, var(--rc-grid-column-gap-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      columnGap: "var(--rc-grid-column-gap-xxl, var(--rc-grid-column-gap-xl, var(--rc-grid-column-gap-lg, var(--rc-grid-column-gap-md, var(--rc-grid-column-gap-sm, var(--rc-grid-column-gap-xs))))))",
    },
  }
});

export const gridRowGap = style({
  rowGap: "var(--rc-grid-row-gap-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      rowGap: "var(--rc-grid-row-gap-sm, var(--rc-grid-row-gap-xs))",
    },
    "screen and (min-width: 768px)": {
      rowGap: "var(--rc-grid-row-gap-md, var(--rc-grid-row-gap-sm, var(--rc-grid-row-gap-xs)))",
    },
    "screen and (min-width: 992px)": {
      rowGap: "var(--rc-grid-row-gap-lg, var(--rc-grid-row-gap-md, var(--rc-grid-row-gap-sm, var(--rc-grid-row-gap-xs))))",
    },
    "screen and (min-width: 1200px)": {
      rowGap: "var(--rc-grid-row-gap-xl, var(--rc-grid-row-gap-lg, var(--rc-grid-row-gap-md, var(--rc-grid-row-gap-sm, var(--rc-grid-row-gap-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      rowGap: "var(--rc-grid-row-gap-xxl, var(--rc-grid-row-gap-xl, var(--rc-grid-row-gap-lg, var(--rc-grid-row-gap-md, var(--rc-grid-row-gap-sm, var(--rc-grid-row-gap-xs))))))",
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
