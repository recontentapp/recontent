import { style } from "@vanilla-extract/css";
import { systemSpacing } from "../../tokens.css";

export const stackRoot = style({ display: "flex" });

export const stackDirection = style({
  flexDirection: "var(--rc-stack-direction-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      flexDirection: "var(--rc-stack-direction-sm, var(--rc-stack-direction-xs))",
    },
    "screen and (min-width: 768px)": {
      flexDirection: "var(--rc-stack-direction-md, var(--rc-stack-direction-sm, var(--rc-stack-direction-xs)))",
    },
    "screen and (min-width: 992px)": {
      flexDirection: "var(--rc-stack-direction-lg, var(--rc-stack-direction-md, var(--rc-stack-direction-sm, var(--rc-stack-direction-xs))))",
    },
    "screen and (min-width: 1200px)": {
      flexDirection: "var(--rc-stack-direction-xl, var(--rc-stack-direction-lg, var(--rc-stack-direction-md, var(--rc-stack-direction-sm, var(--rc-stack-direction-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      flexDirection: "var(--rc-stack-direction-xxl, var(--rc-stack-direction-xl, var(--rc-stack-direction-lg, var(--rc-stack-direction-md, var(--rc-stack-direction-sm, var(--rc-stack-direction-xs))))))",
    },
  }
});

export const stackWrap = style({
  flexWrap: "var(--rc-stack-wrap-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      flexWrap: "var(--rc-stack-wrap-sm, var(--rc-stack-wrap-xs))",
    },
    "screen and (min-width: 768px)": {
      flexWrap: "var(--rc-stack-wrap-md, var(--rc-stack-wrap-sm, var(--rc-stack-wrap-xs)))",
    },
    "screen and (min-width: 992px)": {
      flexWrap: "var(--rc-stack-wrap-lg, var(--rc-stack-wrap-md, var(--rc-stack-wrap-sm, var(--rc-stack-wrap-xs))))",
    },
    "screen and (min-width: 1200px)": {
      flexWrap: "var(--rc-stack-wrap-xl, var(--rc-stack-wrap-lg, var(--rc-stack-wrap-md, var(--rc-stack-wrap-sm, var(--rc-stack-wrap-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      flexWrap: "var(--rc-stack-wrap-xxl, var(--rc-stack-wrap-xl, var(--rc-stack-wrap-lg, var(--rc-stack-wrap-md, var(--rc-stack-wrap-sm, var(--rc-stack-wrap-xs))))))",
    },
  }
});

export const stackAlign = style({
  alignItems: "var(--rc-stack-align-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      alignItems: "var(--rc-stack-align-sm, var(--rc-stack-align-xs))",
    },
    "screen and (min-width: 768px)": {
      alignItems: "var(--rc-stack-align-md, var(--rc-stack-align-sm, var(--rc-stack-align-xs)))",
    },
    "screen and (min-width: 992px)": {
      alignItems: "var(--rc-stack-align-lg, var(--rc-stack-align-md, var(--rc-stack-align-sm, var(--rc-stack-align-xs))))",
    },
    "screen and (min-width: 1200px)": {
      alignItems: "var(--rc-stack-align-xl, var(--rc-stack-align-lg, var(--rc-stack-align-md, var(--rc-stack-align-sm, var(--rc-stack-align-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      alignItems: "var(--rc-stack-align-xxl, var(--rc-stack-align-xl, var(--rc-stack-align-lg, var(--rc-stack-align-md, var(--rc-stack-align-sm, var(--rc-stack-align-xs))))))",
    },
  }
});

export const stackJustify = style({
  justifyContent: "var(--rc-stack-justify-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      justifyContent: "var(--rc-stack-justify-sm, var(--rc-stack-justify-xs))",
    },
    "screen and (min-width: 768px)": {
      justifyContent: "var(--rc-stack-justify-md, var(--rc-stack-justify-sm, var(--rc-stack-justify-xs)))",
    },
    "screen and (min-width: 992px)": {
      justifyContent: "var(--rc-stack-justify-lg, var(--rc-stack-justify-md, var(--rc-stack-justify-sm, var(--rc-stack-justify-xs))))",
    },
    "screen and (min-width: 1200px)": {
      justifyContent: "var(--rc-stack-justify-xl, var(--rc-stack-justify-lg, var(--rc-stack-justify-md, var(--rc-stack-justify-sm, var(--rc-stack-justify-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      justifyContent: "var(--rc-stack-justify-xxl, var(--rc-stack-justify-xl, var(--rc-stack-justify-lg, var(--rc-stack-justify-md, var(--rc-stack-justify-sm, var(--rc-stack-justify-xs))))))",
    },
  }
});

export const stackGap = style({
  gap: "var(--rc-stack-gap-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      gap: "var(--rc-stack-gap-sm, var(--rc-stack-gap-xs))",
    },
    "screen and (min-width: 768px)": {
      gap: "var(--rc-stack-gap-md, var(--rc-stack-gap-sm, var(--rc-stack-gap-xs)))",
    },
    "screen and (min-width: 992px)": {
      gap: "var(--rc-stack-gap-lg, var(--rc-stack-gap-md, var(--rc-stack-gap-sm, var(--rc-stack-gap-xs))))",
    },
    "screen and (min-width: 1200px)": {
      gap: "var(--rc-stack-gap-xl, var(--rc-stack-gap-lg, var(--rc-stack-gap-md, var(--rc-stack-gap-sm, var(--rc-stack-gap-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      gap: "var(--rc-stack-gap-xxl, var(--rc-stack-gap-xl, var(--rc-stack-gap-lg, var(--rc-stack-gap-md, var(--rc-stack-gap-sm, var(--rc-stack-gap-xs))))))",
    },
  }
});
