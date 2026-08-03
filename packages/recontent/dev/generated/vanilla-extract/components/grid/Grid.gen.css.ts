import { style, styleVariants } from "@vanilla-extract/css";
import { systemSpacing } from "../../tokens.css";

export const gridRoot = style({ display: "grid" });

export const gridGap = styleVariants(systemSpacing, (value) => ({ gap: value }));
export const gridColumnGap = styleVariants(systemSpacing, (value) => ({ columnGap: value }));
export const gridRowGap = styleVariants(systemSpacing, (value) => ({ rowGap: value }));

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
