import { style, styleVariants } from "@vanilla-extract/css";
import { systemSpacing, systemColorsSecondary, refRadius, systemBorderScale, systemElevationScale } from "../../tokens.css";

export const boxRoot = style({});

export const boxPadding = style({
  padding: "var(--rc-box-padding-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      padding: "var(--rc-box-padding-sm, var(--rc-box-padding-xs))",
    },
    "screen and (min-width: 768px)": {
      padding: "var(--rc-box-padding-md, var(--rc-box-padding-sm, var(--rc-box-padding-xs)))",
    },
    "screen and (min-width: 992px)": {
      padding: "var(--rc-box-padding-lg, var(--rc-box-padding-md, var(--rc-box-padding-sm, var(--rc-box-padding-xs))))",
    },
    "screen and (min-width: 1200px)": {
      padding: "var(--rc-box-padding-xl, var(--rc-box-padding-lg, var(--rc-box-padding-md, var(--rc-box-padding-sm, var(--rc-box-padding-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      padding: "var(--rc-box-padding-xxl, var(--rc-box-padding-xl, var(--rc-box-padding-lg, var(--rc-box-padding-md, var(--rc-box-padding-sm, var(--rc-box-padding-xs))))))",
    },
  }
});

export const boxPaddingX = style({
  paddingLeft: "var(--rc-box-padding-x-xs)",
  paddingRight: "var(--rc-box-padding-x-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      paddingLeft: "var(--rc-box-padding-x-sm, var(--rc-box-padding-x-xs))",
      paddingRight: "var(--rc-box-padding-x-sm, var(--rc-box-padding-x-xs))",
    },
    "screen and (min-width: 768px)": {
      paddingLeft: "var(--rc-box-padding-x-md, var(--rc-box-padding-x-sm, var(--rc-box-padding-x-xs)))",
      paddingRight: "var(--rc-box-padding-x-md, var(--rc-box-padding-x-sm, var(--rc-box-padding-x-xs)))",
    },
    "screen and (min-width: 992px)": {
      paddingLeft: "var(--rc-box-padding-x-lg, var(--rc-box-padding-x-md, var(--rc-box-padding-x-sm, var(--rc-box-padding-x-xs))))",
      paddingRight: "var(--rc-box-padding-x-lg, var(--rc-box-padding-x-md, var(--rc-box-padding-x-sm, var(--rc-box-padding-x-xs))))",
    },
    "screen and (min-width: 1200px)": {
      paddingLeft: "var(--rc-box-padding-x-xl, var(--rc-box-padding-x-lg, var(--rc-box-padding-x-md, var(--rc-box-padding-x-sm, var(--rc-box-padding-x-xs)))))",
      paddingRight: "var(--rc-box-padding-x-xl, var(--rc-box-padding-x-lg, var(--rc-box-padding-x-md, var(--rc-box-padding-x-sm, var(--rc-box-padding-x-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      paddingLeft: "var(--rc-box-padding-x-xxl, var(--rc-box-padding-x-xl, var(--rc-box-padding-x-lg, var(--rc-box-padding-x-md, var(--rc-box-padding-x-sm, var(--rc-box-padding-x-xs))))))",
      paddingRight: "var(--rc-box-padding-x-xxl, var(--rc-box-padding-x-xl, var(--rc-box-padding-x-lg, var(--rc-box-padding-x-md, var(--rc-box-padding-x-sm, var(--rc-box-padding-x-xs))))))",
    },
  }
});

export const boxPaddingY = style({
  paddingTop: "var(--rc-box-padding-y-xs)",
  paddingBottom: "var(--rc-box-padding-y-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      paddingTop: "var(--rc-box-padding-y-sm, var(--rc-box-padding-y-xs))",
      paddingBottom: "var(--rc-box-padding-y-sm, var(--rc-box-padding-y-xs))",
    },
    "screen and (min-width: 768px)": {
      paddingTop: "var(--rc-box-padding-y-md, var(--rc-box-padding-y-sm, var(--rc-box-padding-y-xs)))",
      paddingBottom: "var(--rc-box-padding-y-md, var(--rc-box-padding-y-sm, var(--rc-box-padding-y-xs)))",
    },
    "screen and (min-width: 992px)": {
      paddingTop: "var(--rc-box-padding-y-lg, var(--rc-box-padding-y-md, var(--rc-box-padding-y-sm, var(--rc-box-padding-y-xs))))",
      paddingBottom: "var(--rc-box-padding-y-lg, var(--rc-box-padding-y-md, var(--rc-box-padding-y-sm, var(--rc-box-padding-y-xs))))",
    },
    "screen and (min-width: 1200px)": {
      paddingTop: "var(--rc-box-padding-y-xl, var(--rc-box-padding-y-lg, var(--rc-box-padding-y-md, var(--rc-box-padding-y-sm, var(--rc-box-padding-y-xs)))))",
      paddingBottom: "var(--rc-box-padding-y-xl, var(--rc-box-padding-y-lg, var(--rc-box-padding-y-md, var(--rc-box-padding-y-sm, var(--rc-box-padding-y-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      paddingTop: "var(--rc-box-padding-y-xxl, var(--rc-box-padding-y-xl, var(--rc-box-padding-y-lg, var(--rc-box-padding-y-md, var(--rc-box-padding-y-sm, var(--rc-box-padding-y-xs))))))",
      paddingBottom: "var(--rc-box-padding-y-xxl, var(--rc-box-padding-y-xl, var(--rc-box-padding-y-lg, var(--rc-box-padding-y-md, var(--rc-box-padding-y-sm, var(--rc-box-padding-y-xs))))))",
    },
  }
});

export const boxPaddingTop = style({
  paddingTop: "var(--rc-box-padding-top-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      paddingTop: "var(--rc-box-padding-top-sm, var(--rc-box-padding-top-xs))",
    },
    "screen and (min-width: 768px)": {
      paddingTop: "var(--rc-box-padding-top-md, var(--rc-box-padding-top-sm, var(--rc-box-padding-top-xs)))",
    },
    "screen and (min-width: 992px)": {
      paddingTop: "var(--rc-box-padding-top-lg, var(--rc-box-padding-top-md, var(--rc-box-padding-top-sm, var(--rc-box-padding-top-xs))))",
    },
    "screen and (min-width: 1200px)": {
      paddingTop: "var(--rc-box-padding-top-xl, var(--rc-box-padding-top-lg, var(--rc-box-padding-top-md, var(--rc-box-padding-top-sm, var(--rc-box-padding-top-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      paddingTop: "var(--rc-box-padding-top-xxl, var(--rc-box-padding-top-xl, var(--rc-box-padding-top-lg, var(--rc-box-padding-top-md, var(--rc-box-padding-top-sm, var(--rc-box-padding-top-xs))))))",
    },
  }
});

export const boxPaddingRight = style({
  paddingRight: "var(--rc-box-padding-right-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      paddingRight: "var(--rc-box-padding-right-sm, var(--rc-box-padding-right-xs))",
    },
    "screen and (min-width: 768px)": {
      paddingRight: "var(--rc-box-padding-right-md, var(--rc-box-padding-right-sm, var(--rc-box-padding-right-xs)))",
    },
    "screen and (min-width: 992px)": {
      paddingRight: "var(--rc-box-padding-right-lg, var(--rc-box-padding-right-md, var(--rc-box-padding-right-sm, var(--rc-box-padding-right-xs))))",
    },
    "screen and (min-width: 1200px)": {
      paddingRight: "var(--rc-box-padding-right-xl, var(--rc-box-padding-right-lg, var(--rc-box-padding-right-md, var(--rc-box-padding-right-sm, var(--rc-box-padding-right-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      paddingRight: "var(--rc-box-padding-right-xxl, var(--rc-box-padding-right-xl, var(--rc-box-padding-right-lg, var(--rc-box-padding-right-md, var(--rc-box-padding-right-sm, var(--rc-box-padding-right-xs))))))",
    },
  }
});

export const boxPaddingBottom = style({
  paddingBottom: "var(--rc-box-padding-bottom-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      paddingBottom: "var(--rc-box-padding-bottom-sm, var(--rc-box-padding-bottom-xs))",
    },
    "screen and (min-width: 768px)": {
      paddingBottom: "var(--rc-box-padding-bottom-md, var(--rc-box-padding-bottom-sm, var(--rc-box-padding-bottom-xs)))",
    },
    "screen and (min-width: 992px)": {
      paddingBottom: "var(--rc-box-padding-bottom-lg, var(--rc-box-padding-bottom-md, var(--rc-box-padding-bottom-sm, var(--rc-box-padding-bottom-xs))))",
    },
    "screen and (min-width: 1200px)": {
      paddingBottom: "var(--rc-box-padding-bottom-xl, var(--rc-box-padding-bottom-lg, var(--rc-box-padding-bottom-md, var(--rc-box-padding-bottom-sm, var(--rc-box-padding-bottom-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      paddingBottom: "var(--rc-box-padding-bottom-xxl, var(--rc-box-padding-bottom-xl, var(--rc-box-padding-bottom-lg, var(--rc-box-padding-bottom-md, var(--rc-box-padding-bottom-sm, var(--rc-box-padding-bottom-xs))))))",
    },
  }
});

export const boxPaddingLeft = style({
  paddingLeft: "var(--rc-box-padding-left-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      paddingLeft: "var(--rc-box-padding-left-sm, var(--rc-box-padding-left-xs))",
    },
    "screen and (min-width: 768px)": {
      paddingLeft: "var(--rc-box-padding-left-md, var(--rc-box-padding-left-sm, var(--rc-box-padding-left-xs)))",
    },
    "screen and (min-width: 992px)": {
      paddingLeft: "var(--rc-box-padding-left-lg, var(--rc-box-padding-left-md, var(--rc-box-padding-left-sm, var(--rc-box-padding-left-xs))))",
    },
    "screen and (min-width: 1200px)": {
      paddingLeft: "var(--rc-box-padding-left-xl, var(--rc-box-padding-left-lg, var(--rc-box-padding-left-md, var(--rc-box-padding-left-sm, var(--rc-box-padding-left-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      paddingLeft: "var(--rc-box-padding-left-xxl, var(--rc-box-padding-left-xl, var(--rc-box-padding-left-lg, var(--rc-box-padding-left-md, var(--rc-box-padding-left-sm, var(--rc-box-padding-left-xs))))))",
    },
  }
});

export const boxMargin = style({
  margin: "var(--rc-box-margin-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      margin: "var(--rc-box-margin-sm, var(--rc-box-margin-xs))",
    },
    "screen and (min-width: 768px)": {
      margin: "var(--rc-box-margin-md, var(--rc-box-margin-sm, var(--rc-box-margin-xs)))",
    },
    "screen and (min-width: 992px)": {
      margin: "var(--rc-box-margin-lg, var(--rc-box-margin-md, var(--rc-box-margin-sm, var(--rc-box-margin-xs))))",
    },
    "screen and (min-width: 1200px)": {
      margin: "var(--rc-box-margin-xl, var(--rc-box-margin-lg, var(--rc-box-margin-md, var(--rc-box-margin-sm, var(--rc-box-margin-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      margin: "var(--rc-box-margin-xxl, var(--rc-box-margin-xl, var(--rc-box-margin-lg, var(--rc-box-margin-md, var(--rc-box-margin-sm, var(--rc-box-margin-xs))))))",
    },
  }
});

export const boxMarginX = style({
  marginLeft: "var(--rc-box-margin-x-xs)",
  marginRight: "var(--rc-box-margin-x-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      marginLeft: "var(--rc-box-margin-x-sm, var(--rc-box-margin-x-xs))",
      marginRight: "var(--rc-box-margin-x-sm, var(--rc-box-margin-x-xs))",
    },
    "screen and (min-width: 768px)": {
      marginLeft: "var(--rc-box-margin-x-md, var(--rc-box-margin-x-sm, var(--rc-box-margin-x-xs)))",
      marginRight: "var(--rc-box-margin-x-md, var(--rc-box-margin-x-sm, var(--rc-box-margin-x-xs)))",
    },
    "screen and (min-width: 992px)": {
      marginLeft: "var(--rc-box-margin-x-lg, var(--rc-box-margin-x-md, var(--rc-box-margin-x-sm, var(--rc-box-margin-x-xs))))",
      marginRight: "var(--rc-box-margin-x-lg, var(--rc-box-margin-x-md, var(--rc-box-margin-x-sm, var(--rc-box-margin-x-xs))))",
    },
    "screen and (min-width: 1200px)": {
      marginLeft: "var(--rc-box-margin-x-xl, var(--rc-box-margin-x-lg, var(--rc-box-margin-x-md, var(--rc-box-margin-x-sm, var(--rc-box-margin-x-xs)))))",
      marginRight: "var(--rc-box-margin-x-xl, var(--rc-box-margin-x-lg, var(--rc-box-margin-x-md, var(--rc-box-margin-x-sm, var(--rc-box-margin-x-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      marginLeft: "var(--rc-box-margin-x-xxl, var(--rc-box-margin-x-xl, var(--rc-box-margin-x-lg, var(--rc-box-margin-x-md, var(--rc-box-margin-x-sm, var(--rc-box-margin-x-xs))))))",
      marginRight: "var(--rc-box-margin-x-xxl, var(--rc-box-margin-x-xl, var(--rc-box-margin-x-lg, var(--rc-box-margin-x-md, var(--rc-box-margin-x-sm, var(--rc-box-margin-x-xs))))))",
    },
  }
});

export const boxMarginY = style({
  marginTop: "var(--rc-box-margin-y-xs)",
  marginBottom: "var(--rc-box-margin-y-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      marginTop: "var(--rc-box-margin-y-sm, var(--rc-box-margin-y-xs))",
      marginBottom: "var(--rc-box-margin-y-sm, var(--rc-box-margin-y-xs))",
    },
    "screen and (min-width: 768px)": {
      marginTop: "var(--rc-box-margin-y-md, var(--rc-box-margin-y-sm, var(--rc-box-margin-y-xs)))",
      marginBottom: "var(--rc-box-margin-y-md, var(--rc-box-margin-y-sm, var(--rc-box-margin-y-xs)))",
    },
    "screen and (min-width: 992px)": {
      marginTop: "var(--rc-box-margin-y-lg, var(--rc-box-margin-y-md, var(--rc-box-margin-y-sm, var(--rc-box-margin-y-xs))))",
      marginBottom: "var(--rc-box-margin-y-lg, var(--rc-box-margin-y-md, var(--rc-box-margin-y-sm, var(--rc-box-margin-y-xs))))",
    },
    "screen and (min-width: 1200px)": {
      marginTop: "var(--rc-box-margin-y-xl, var(--rc-box-margin-y-lg, var(--rc-box-margin-y-md, var(--rc-box-margin-y-sm, var(--rc-box-margin-y-xs)))))",
      marginBottom: "var(--rc-box-margin-y-xl, var(--rc-box-margin-y-lg, var(--rc-box-margin-y-md, var(--rc-box-margin-y-sm, var(--rc-box-margin-y-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      marginTop: "var(--rc-box-margin-y-xxl, var(--rc-box-margin-y-xl, var(--rc-box-margin-y-lg, var(--rc-box-margin-y-md, var(--rc-box-margin-y-sm, var(--rc-box-margin-y-xs))))))",
      marginBottom: "var(--rc-box-margin-y-xxl, var(--rc-box-margin-y-xl, var(--rc-box-margin-y-lg, var(--rc-box-margin-y-md, var(--rc-box-margin-y-sm, var(--rc-box-margin-y-xs))))))",
    },
  }
});

export const boxMarginTop = style({
  marginTop: "var(--rc-box-margin-top-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      marginTop: "var(--rc-box-margin-top-sm, var(--rc-box-margin-top-xs))",
    },
    "screen and (min-width: 768px)": {
      marginTop: "var(--rc-box-margin-top-md, var(--rc-box-margin-top-sm, var(--rc-box-margin-top-xs)))",
    },
    "screen and (min-width: 992px)": {
      marginTop: "var(--rc-box-margin-top-lg, var(--rc-box-margin-top-md, var(--rc-box-margin-top-sm, var(--rc-box-margin-top-xs))))",
    },
    "screen and (min-width: 1200px)": {
      marginTop: "var(--rc-box-margin-top-xl, var(--rc-box-margin-top-lg, var(--rc-box-margin-top-md, var(--rc-box-margin-top-sm, var(--rc-box-margin-top-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      marginTop: "var(--rc-box-margin-top-xxl, var(--rc-box-margin-top-xl, var(--rc-box-margin-top-lg, var(--rc-box-margin-top-md, var(--rc-box-margin-top-sm, var(--rc-box-margin-top-xs))))))",
    },
  }
});

export const boxMarginRight = style({
  marginRight: "var(--rc-box-margin-right-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      marginRight: "var(--rc-box-margin-right-sm, var(--rc-box-margin-right-xs))",
    },
    "screen and (min-width: 768px)": {
      marginRight: "var(--rc-box-margin-right-md, var(--rc-box-margin-right-sm, var(--rc-box-margin-right-xs)))",
    },
    "screen and (min-width: 992px)": {
      marginRight: "var(--rc-box-margin-right-lg, var(--rc-box-margin-right-md, var(--rc-box-margin-right-sm, var(--rc-box-margin-right-xs))))",
    },
    "screen and (min-width: 1200px)": {
      marginRight: "var(--rc-box-margin-right-xl, var(--rc-box-margin-right-lg, var(--rc-box-margin-right-md, var(--rc-box-margin-right-sm, var(--rc-box-margin-right-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      marginRight: "var(--rc-box-margin-right-xxl, var(--rc-box-margin-right-xl, var(--rc-box-margin-right-lg, var(--rc-box-margin-right-md, var(--rc-box-margin-right-sm, var(--rc-box-margin-right-xs))))))",
    },
  }
});

export const boxMarginBottom = style({
  marginBottom: "var(--rc-box-margin-bottom-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      marginBottom: "var(--rc-box-margin-bottom-sm, var(--rc-box-margin-bottom-xs))",
    },
    "screen and (min-width: 768px)": {
      marginBottom: "var(--rc-box-margin-bottom-md, var(--rc-box-margin-bottom-sm, var(--rc-box-margin-bottom-xs)))",
    },
    "screen and (min-width: 992px)": {
      marginBottom: "var(--rc-box-margin-bottom-lg, var(--rc-box-margin-bottom-md, var(--rc-box-margin-bottom-sm, var(--rc-box-margin-bottom-xs))))",
    },
    "screen and (min-width: 1200px)": {
      marginBottom: "var(--rc-box-margin-bottom-xl, var(--rc-box-margin-bottom-lg, var(--rc-box-margin-bottom-md, var(--rc-box-margin-bottom-sm, var(--rc-box-margin-bottom-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      marginBottom: "var(--rc-box-margin-bottom-xxl, var(--rc-box-margin-bottom-xl, var(--rc-box-margin-bottom-lg, var(--rc-box-margin-bottom-md, var(--rc-box-margin-bottom-sm, var(--rc-box-margin-bottom-xs))))))",
    },
  }
});

export const boxMarginLeft = style({
  marginLeft: "var(--rc-box-margin-left-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      marginLeft: "var(--rc-box-margin-left-sm, var(--rc-box-margin-left-xs))",
    },
    "screen and (min-width: 768px)": {
      marginLeft: "var(--rc-box-margin-left-md, var(--rc-box-margin-left-sm, var(--rc-box-margin-left-xs)))",
    },
    "screen and (min-width: 992px)": {
      marginLeft: "var(--rc-box-margin-left-lg, var(--rc-box-margin-left-md, var(--rc-box-margin-left-sm, var(--rc-box-margin-left-xs))))",
    },
    "screen and (min-width: 1200px)": {
      marginLeft: "var(--rc-box-margin-left-xl, var(--rc-box-margin-left-lg, var(--rc-box-margin-left-md, var(--rc-box-margin-left-sm, var(--rc-box-margin-left-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      marginLeft: "var(--rc-box-margin-left-xxl, var(--rc-box-margin-left-xl, var(--rc-box-margin-left-lg, var(--rc-box-margin-left-md, var(--rc-box-margin-left-sm, var(--rc-box-margin-left-xs))))))",
    },
  }
});

export const boxGap = style({
  gap: "var(--rc-box-gap-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      gap: "var(--rc-box-gap-sm, var(--rc-box-gap-xs))",
    },
    "screen and (min-width: 768px)": {
      gap: "var(--rc-box-gap-md, var(--rc-box-gap-sm, var(--rc-box-gap-xs)))",
    },
    "screen and (min-width: 992px)": {
      gap: "var(--rc-box-gap-lg, var(--rc-box-gap-md, var(--rc-box-gap-sm, var(--rc-box-gap-xs))))",
    },
    "screen and (min-width: 1200px)": {
      gap: "var(--rc-box-gap-xl, var(--rc-box-gap-lg, var(--rc-box-gap-md, var(--rc-box-gap-sm, var(--rc-box-gap-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      gap: "var(--rc-box-gap-xxl, var(--rc-box-gap-xl, var(--rc-box-gap-lg, var(--rc-box-gap-md, var(--rc-box-gap-sm, var(--rc-box-gap-xs))))))",
    },
  }
});

export const boxDisplay = style({
  display: "var(--rc-box-display-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      display: "var(--rc-box-display-sm, var(--rc-box-display-xs))",
    },
    "screen and (min-width: 768px)": {
      display: "var(--rc-box-display-md, var(--rc-box-display-sm, var(--rc-box-display-xs)))",
    },
    "screen and (min-width: 992px)": {
      display: "var(--rc-box-display-lg, var(--rc-box-display-md, var(--rc-box-display-sm, var(--rc-box-display-xs))))",
    },
    "screen and (min-width: 1200px)": {
      display: "var(--rc-box-display-xl, var(--rc-box-display-lg, var(--rc-box-display-md, var(--rc-box-display-sm, var(--rc-box-display-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      display: "var(--rc-box-display-xxl, var(--rc-box-display-xl, var(--rc-box-display-lg, var(--rc-box-display-md, var(--rc-box-display-sm, var(--rc-box-display-xs))))))",
    },
  }
});

export const boxWidth = style({
  width: "var(--rc-box-width-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      width: "var(--rc-box-width-sm, var(--rc-box-width-xs))",
    },
    "screen and (min-width: 768px)": {
      width: "var(--rc-box-width-md, var(--rc-box-width-sm, var(--rc-box-width-xs)))",
    },
    "screen and (min-width: 992px)": {
      width: "var(--rc-box-width-lg, var(--rc-box-width-md, var(--rc-box-width-sm, var(--rc-box-width-xs))))",
    },
    "screen and (min-width: 1200px)": {
      width: "var(--rc-box-width-xl, var(--rc-box-width-lg, var(--rc-box-width-md, var(--rc-box-width-sm, var(--rc-box-width-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      width: "var(--rc-box-width-xxl, var(--rc-box-width-xl, var(--rc-box-width-lg, var(--rc-box-width-md, var(--rc-box-width-sm, var(--rc-box-width-xs))))))",
    },
  }
});

export const boxHeight = style({
  height: "var(--rc-box-height-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      height: "var(--rc-box-height-sm, var(--rc-box-height-xs))",
    },
    "screen and (min-width: 768px)": {
      height: "var(--rc-box-height-md, var(--rc-box-height-sm, var(--rc-box-height-xs)))",
    },
    "screen and (min-width: 992px)": {
      height: "var(--rc-box-height-lg, var(--rc-box-height-md, var(--rc-box-height-sm, var(--rc-box-height-xs))))",
    },
    "screen and (min-width: 1200px)": {
      height: "var(--rc-box-height-xl, var(--rc-box-height-lg, var(--rc-box-height-md, var(--rc-box-height-sm, var(--rc-box-height-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      height: "var(--rc-box-height-xxl, var(--rc-box-height-xl, var(--rc-box-height-lg, var(--rc-box-height-md, var(--rc-box-height-sm, var(--rc-box-height-xs))))))",
    },
  }
});

export const boxMinWidth = style({
  minWidth: "var(--rc-box-min-width-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      minWidth: "var(--rc-box-min-width-sm, var(--rc-box-min-width-xs))",
    },
    "screen and (min-width: 768px)": {
      minWidth: "var(--rc-box-min-width-md, var(--rc-box-min-width-sm, var(--rc-box-min-width-xs)))",
    },
    "screen and (min-width: 992px)": {
      minWidth: "var(--rc-box-min-width-lg, var(--rc-box-min-width-md, var(--rc-box-min-width-sm, var(--rc-box-min-width-xs))))",
    },
    "screen and (min-width: 1200px)": {
      minWidth: "var(--rc-box-min-width-xl, var(--rc-box-min-width-lg, var(--rc-box-min-width-md, var(--rc-box-min-width-sm, var(--rc-box-min-width-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      minWidth: "var(--rc-box-min-width-xxl, var(--rc-box-min-width-xl, var(--rc-box-min-width-lg, var(--rc-box-min-width-md, var(--rc-box-min-width-sm, var(--rc-box-min-width-xs))))))",
    },
  }
});

export const boxMinHeight = style({
  minHeight: "var(--rc-box-min-height-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      minHeight: "var(--rc-box-min-height-sm, var(--rc-box-min-height-xs))",
    },
    "screen and (min-width: 768px)": {
      minHeight: "var(--rc-box-min-height-md, var(--rc-box-min-height-sm, var(--rc-box-min-height-xs)))",
    },
    "screen and (min-width: 992px)": {
      minHeight: "var(--rc-box-min-height-lg, var(--rc-box-min-height-md, var(--rc-box-min-height-sm, var(--rc-box-min-height-xs))))",
    },
    "screen and (min-width: 1200px)": {
      minHeight: "var(--rc-box-min-height-xl, var(--rc-box-min-height-lg, var(--rc-box-min-height-md, var(--rc-box-min-height-sm, var(--rc-box-min-height-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      minHeight: "var(--rc-box-min-height-xxl, var(--rc-box-min-height-xl, var(--rc-box-min-height-lg, var(--rc-box-min-height-md, var(--rc-box-min-height-sm, var(--rc-box-min-height-xs))))))",
    },
  }
});

export const boxMaxWidth = style({
  maxWidth: "var(--rc-box-max-width-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      maxWidth: "var(--rc-box-max-width-sm, var(--rc-box-max-width-xs))",
    },
    "screen and (min-width: 768px)": {
      maxWidth: "var(--rc-box-max-width-md, var(--rc-box-max-width-sm, var(--rc-box-max-width-xs)))",
    },
    "screen and (min-width: 992px)": {
      maxWidth: "var(--rc-box-max-width-lg, var(--rc-box-max-width-md, var(--rc-box-max-width-sm, var(--rc-box-max-width-xs))))",
    },
    "screen and (min-width: 1200px)": {
      maxWidth: "var(--rc-box-max-width-xl, var(--rc-box-max-width-lg, var(--rc-box-max-width-md, var(--rc-box-max-width-sm, var(--rc-box-max-width-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      maxWidth: "var(--rc-box-max-width-xxl, var(--rc-box-max-width-xl, var(--rc-box-max-width-lg, var(--rc-box-max-width-md, var(--rc-box-max-width-sm, var(--rc-box-max-width-xs))))))",
    },
  }
});

export const boxMaxHeight = style({
  maxHeight: "var(--rc-box-max-height-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      maxHeight: "var(--rc-box-max-height-sm, var(--rc-box-max-height-xs))",
    },
    "screen and (min-width: 768px)": {
      maxHeight: "var(--rc-box-max-height-md, var(--rc-box-max-height-sm, var(--rc-box-max-height-xs)))",
    },
    "screen and (min-width: 992px)": {
      maxHeight: "var(--rc-box-max-height-lg, var(--rc-box-max-height-md, var(--rc-box-max-height-sm, var(--rc-box-max-height-xs))))",
    },
    "screen and (min-width: 1200px)": {
      maxHeight: "var(--rc-box-max-height-xl, var(--rc-box-max-height-lg, var(--rc-box-max-height-md, var(--rc-box-max-height-sm, var(--rc-box-max-height-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      maxHeight: "var(--rc-box-max-height-xxl, var(--rc-box-max-height-xl, var(--rc-box-max-height-lg, var(--rc-box-max-height-md, var(--rc-box-max-height-sm, var(--rc-box-max-height-xs))))))",
    },
  }
});

export const boxBackgroundColor = styleVariants(systemColorsSecondary, (value) => ({ backgroundColor: value }));

export const boxBorderRadius = styleVariants(refRadius, (value) => ({ borderRadius: value }));

export const boxBorder = styleVariants(systemBorderScale, (value) => ({ border: value }));

export const boxBoxShadow = styleVariants(systemElevationScale, (value) => ({ boxShadow: value }));
