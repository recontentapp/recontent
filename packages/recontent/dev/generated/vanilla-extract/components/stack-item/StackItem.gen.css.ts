import { style, styleVariants } from "@vanilla-extract/css";
import { systemSpacing } from "../../tokens.css";

export const stackItemRoot = style({});

export const stackItemBasis = style({
  flexBasis: "var(--rc-stack-item-basis-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      flexBasis: "var(--rc-stack-item-basis-md, var(--rc-stack-item-basis-base))",
    },
    "screen and (min-width: 80rem)": {
      flexBasis: "var(--rc-stack-item-basis-lg, var(--rc-stack-item-basis-md, var(--rc-stack-item-basis-base)))",
    },
  }
});

export const stackItemGrow = style({
  flexGrow: "var(--rc-stack-item-grow-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      flexGrow: "var(--rc-stack-item-grow-md, var(--rc-stack-item-grow-base))",
    },
    "screen and (min-width: 80rem)": {
      flexGrow: "var(--rc-stack-item-grow-lg, var(--rc-stack-item-grow-md, var(--rc-stack-item-grow-base)))",
    },
  }
});

export const stackItemShrink = style({
  flexShrink: "var(--rc-stack-item-shrink-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      flexShrink: "var(--rc-stack-item-shrink-md, var(--rc-stack-item-shrink-base))",
    },
    "screen and (min-width: 80rem)": {
      flexShrink: "var(--rc-stack-item-shrink-lg, var(--rc-stack-item-shrink-md, var(--rc-stack-item-shrink-base)))",
    },
  }
});

export const stackItemOrder = style({
  order: "var(--rc-stack-item-order-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      order: "var(--rc-stack-item-order-md, var(--rc-stack-item-order-base))",
    },
    "screen and (min-width: 80rem)": {
      order: "var(--rc-stack-item-order-lg, var(--rc-stack-item-order-md, var(--rc-stack-item-order-base)))",
    },
  }
});

export const stackItemAlignSelf = styleVariants({
  auto: { alignSelf: "auto" },
  start: { alignSelf: "flex-start" },
  center: { alignSelf: "center" },
  end: { alignSelf: "flex-end" },
  stretch: { alignSelf: "stretch" },
  baseline: { alignSelf: "baseline" },
});
