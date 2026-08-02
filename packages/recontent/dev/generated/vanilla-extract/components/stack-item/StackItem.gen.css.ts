import { style, styleVariants } from "@vanilla-extract/css";
import { systemSpacing } from "../../tokens.css";

export const stackItemRoot = style({});

export const stackItemBasis = styleVariants(systemSpacing, (value) => ({ flexBasis: value }));

export const stackItemBasisAuto = style({ flexBasis: "auto" });
export const stackItemBasisFull = style({ flexBasis: "100%" });

export const stackItemAlignSelf = styleVariants({
  auto: { alignSelf: "auto" },
  start: { alignSelf: "flex-start" },
  center: { alignSelf: "center" },
  end: { alignSelf: "flex-end" },
  stretch: { alignSelf: "stretch" },
  baseline: { alignSelf: "baseline" },
});
