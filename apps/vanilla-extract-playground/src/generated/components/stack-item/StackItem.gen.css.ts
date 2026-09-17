import { style, styleVariants } from "@vanilla-extract/css";
import { systemSpacing } from "../../tokens.css";

export const stackItemRoot = style({});

export const stackItemBasis = style({
  flexBasis: "var(--rc-stack-item-basis-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      flexBasis: "var(--rc-stack-item-basis-sm, var(--rc-stack-item-basis-xs))",
    },
    "screen and (min-width: 768px)": {
      flexBasis: "var(--rc-stack-item-basis-md, var(--rc-stack-item-basis-sm, var(--rc-stack-item-basis-xs)))",
    },
    "screen and (min-width: 992px)": {
      flexBasis: "var(--rc-stack-item-basis-lg, var(--rc-stack-item-basis-md, var(--rc-stack-item-basis-sm, var(--rc-stack-item-basis-xs))))",
    },
    "screen and (min-width: 1200px)": {
      flexBasis: "var(--rc-stack-item-basis-xl, var(--rc-stack-item-basis-lg, var(--rc-stack-item-basis-md, var(--rc-stack-item-basis-sm, var(--rc-stack-item-basis-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      flexBasis: "var(--rc-stack-item-basis-xxl, var(--rc-stack-item-basis-xl, var(--rc-stack-item-basis-lg, var(--rc-stack-item-basis-md, var(--rc-stack-item-basis-sm, var(--rc-stack-item-basis-xs))))))",
    },
  }
});

export const stackItemGrow = style({
  flexGrow: "var(--rc-stack-item-grow-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      flexGrow: "var(--rc-stack-item-grow-sm, var(--rc-stack-item-grow-xs))",
    },
    "screen and (min-width: 768px)": {
      flexGrow: "var(--rc-stack-item-grow-md, var(--rc-stack-item-grow-sm, var(--rc-stack-item-grow-xs)))",
    },
    "screen and (min-width: 992px)": {
      flexGrow: "var(--rc-stack-item-grow-lg, var(--rc-stack-item-grow-md, var(--rc-stack-item-grow-sm, var(--rc-stack-item-grow-xs))))",
    },
    "screen and (min-width: 1200px)": {
      flexGrow: "var(--rc-stack-item-grow-xl, var(--rc-stack-item-grow-lg, var(--rc-stack-item-grow-md, var(--rc-stack-item-grow-sm, var(--rc-stack-item-grow-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      flexGrow: "var(--rc-stack-item-grow-xxl, var(--rc-stack-item-grow-xl, var(--rc-stack-item-grow-lg, var(--rc-stack-item-grow-md, var(--rc-stack-item-grow-sm, var(--rc-stack-item-grow-xs))))))",
    },
  }
});

export const stackItemShrink = style({
  flexShrink: "var(--rc-stack-item-shrink-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      flexShrink: "var(--rc-stack-item-shrink-sm, var(--rc-stack-item-shrink-xs))",
    },
    "screen and (min-width: 768px)": {
      flexShrink: "var(--rc-stack-item-shrink-md, var(--rc-stack-item-shrink-sm, var(--rc-stack-item-shrink-xs)))",
    },
    "screen and (min-width: 992px)": {
      flexShrink: "var(--rc-stack-item-shrink-lg, var(--rc-stack-item-shrink-md, var(--rc-stack-item-shrink-sm, var(--rc-stack-item-shrink-xs))))",
    },
    "screen and (min-width: 1200px)": {
      flexShrink: "var(--rc-stack-item-shrink-xl, var(--rc-stack-item-shrink-lg, var(--rc-stack-item-shrink-md, var(--rc-stack-item-shrink-sm, var(--rc-stack-item-shrink-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      flexShrink: "var(--rc-stack-item-shrink-xxl, var(--rc-stack-item-shrink-xl, var(--rc-stack-item-shrink-lg, var(--rc-stack-item-shrink-md, var(--rc-stack-item-shrink-sm, var(--rc-stack-item-shrink-xs))))))",
    },
  }
});

export const stackItemOrder = style({
  order: "var(--rc-stack-item-order-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      order: "var(--rc-stack-item-order-sm, var(--rc-stack-item-order-xs))",
    },
    "screen and (min-width: 768px)": {
      order: "var(--rc-stack-item-order-md, var(--rc-stack-item-order-sm, var(--rc-stack-item-order-xs)))",
    },
    "screen and (min-width: 992px)": {
      order: "var(--rc-stack-item-order-lg, var(--rc-stack-item-order-md, var(--rc-stack-item-order-sm, var(--rc-stack-item-order-xs))))",
    },
    "screen and (min-width: 1200px)": {
      order: "var(--rc-stack-item-order-xl, var(--rc-stack-item-order-lg, var(--rc-stack-item-order-md, var(--rc-stack-item-order-sm, var(--rc-stack-item-order-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      order: "var(--rc-stack-item-order-xxl, var(--rc-stack-item-order-xl, var(--rc-stack-item-order-lg, var(--rc-stack-item-order-md, var(--rc-stack-item-order-sm, var(--rc-stack-item-order-xs))))))",
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
