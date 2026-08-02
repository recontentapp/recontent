import { style, styleVariants } from "@vanilla-extract/css";
import { systemSpacing } from "../../tokens.css";

export const stackRoot = style({ display: "flex" });

export const stackDirectionRow = style({ flexDirection: "row" });
export const stackDirectionColumn = style({ flexDirection: "column" });

export const stackWrap = style({ flexWrap: "wrap" });

export const stackAlign = styleVariants({
  start: { alignItems: "flex-start" },
  center: { alignItems: "center" },
  end: { alignItems: "flex-end" },
  stretch: { alignItems: "stretch" },
  baseline: { alignItems: "baseline" },
});

export const stackJustify = styleVariants({
  start: { justifyContent: "flex-start" },
  center: { justifyContent: "center" },
  end: { justifyContent: "flex-end" },
  "space-between": { justifyContent: "space-between" },
  "space-around": { justifyContent: "space-around" },
  "space-evenly": { justifyContent: "space-evenly" },
});

export const stackGap = styleVariants(systemSpacing, (value) => ({ gap: value }));
