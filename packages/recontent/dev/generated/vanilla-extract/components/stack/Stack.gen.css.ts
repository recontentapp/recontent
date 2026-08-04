import { style } from "@vanilla-extract/css";
import { systemSpacing } from "../../tokens.css";

export const stackRoot = style({ display: "flex" });

export const stackDirection = style({
  flexDirection: "var(--rc-stack-direction-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      flexDirection: "var(--rc-stack-direction-md, var(--rc-stack-direction-base))",
    },
    "screen and (min-width: 80rem)": {
      flexDirection: "var(--rc-stack-direction-lg, var(--rc-stack-direction-md, var(--rc-stack-direction-base)))",
    },
  }
});

export const stackWrap = style({
  flexWrap: "var(--rc-stack-wrap-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      flexWrap: "var(--rc-stack-wrap-md, var(--rc-stack-wrap-base))",
    },
    "screen and (min-width: 80rem)": {
      flexWrap: "var(--rc-stack-wrap-lg, var(--rc-stack-wrap-md, var(--rc-stack-wrap-base)))",
    },
  }
});

export const stackAlign = style({
  alignItems: "var(--rc-stack-align-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      alignItems: "var(--rc-stack-align-md, var(--rc-stack-align-base))",
    },
    "screen and (min-width: 80rem)": {
      alignItems: "var(--rc-stack-align-lg, var(--rc-stack-align-md, var(--rc-stack-align-base)))",
    },
  }
});

export const stackJustify = style({
  justifyContent: "var(--rc-stack-justify-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      justifyContent: "var(--rc-stack-justify-md, var(--rc-stack-justify-base))",
    },
    "screen and (min-width: 80rem)": {
      justifyContent: "var(--rc-stack-justify-lg, var(--rc-stack-justify-md, var(--rc-stack-justify-base)))",
    },
  }
});

export const stackGap = style({
  gap: "var(--rc-stack-gap-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      gap: "var(--rc-stack-gap-md, var(--rc-stack-gap-base))",
    },
    "screen and (min-width: 80rem)": {
      gap: "var(--rc-stack-gap-lg, var(--rc-stack-gap-md, var(--rc-stack-gap-base)))",
    },
  }
});
