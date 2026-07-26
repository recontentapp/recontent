import { style, styleVariants } from "@vanilla-extract/css";

export const centerRoot = style({ display: "flex" });

export const centerInline = style({ display: "inline-flex" });

export const centerAxis = styleVariants({
  both: { alignItems: "center", justifyContent: "center" },
  horizontal: { justifyContent: "center" },
  vertical: { alignItems: "center" },
});
