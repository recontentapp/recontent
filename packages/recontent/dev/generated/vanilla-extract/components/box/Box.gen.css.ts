import { style, styleVariants } from "@vanilla-extract/css";
import { systemSpacing, systemColorsSecondary, refRadiusScale, systemBorderScale, systemElevationScale } from "../../tokens.css";

export const boxRoot = style({});

export const boxPadding = style({
  padding: "var(--rc-box-padding-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      padding: "var(--rc-box-padding-md, var(--rc-box-padding-base))",
    },
    "screen and (min-width: 80rem)": {
      padding: "var(--rc-box-padding-lg, var(--rc-box-padding-md, var(--rc-box-padding-base)))",
    },
  }
});

export const boxPaddingX = style({
  paddingLeft: "var(--rc-box-padding-x-base)",
  paddingRight: "var(--rc-box-padding-x-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      paddingLeft: "var(--rc-box-padding-x-md, var(--rc-box-padding-x-base))",
      paddingRight: "var(--rc-box-padding-x-md, var(--rc-box-padding-x-base))",
    },
    "screen and (min-width: 80rem)": {
      paddingLeft: "var(--rc-box-padding-x-lg, var(--rc-box-padding-x-md, var(--rc-box-padding-x-base)))",
      paddingRight: "var(--rc-box-padding-x-lg, var(--rc-box-padding-x-md, var(--rc-box-padding-x-base)))",
    },
  }
});

export const boxPaddingY = style({
  paddingTop: "var(--rc-box-padding-y-base)",
  paddingBottom: "var(--rc-box-padding-y-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      paddingTop: "var(--rc-box-padding-y-md, var(--rc-box-padding-y-base))",
      paddingBottom: "var(--rc-box-padding-y-md, var(--rc-box-padding-y-base))",
    },
    "screen and (min-width: 80rem)": {
      paddingTop: "var(--rc-box-padding-y-lg, var(--rc-box-padding-y-md, var(--rc-box-padding-y-base)))",
      paddingBottom: "var(--rc-box-padding-y-lg, var(--rc-box-padding-y-md, var(--rc-box-padding-y-base)))",
    },
  }
});

export const boxPaddingTop = style({
  paddingTop: "var(--rc-box-padding-top-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      paddingTop: "var(--rc-box-padding-top-md, var(--rc-box-padding-top-base))",
    },
    "screen and (min-width: 80rem)": {
      paddingTop: "var(--rc-box-padding-top-lg, var(--rc-box-padding-top-md, var(--rc-box-padding-top-base)))",
    },
  }
});

export const boxPaddingRight = style({
  paddingRight: "var(--rc-box-padding-right-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      paddingRight: "var(--rc-box-padding-right-md, var(--rc-box-padding-right-base))",
    },
    "screen and (min-width: 80rem)": {
      paddingRight: "var(--rc-box-padding-right-lg, var(--rc-box-padding-right-md, var(--rc-box-padding-right-base)))",
    },
  }
});

export const boxPaddingBottom = style({
  paddingBottom: "var(--rc-box-padding-bottom-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      paddingBottom: "var(--rc-box-padding-bottom-md, var(--rc-box-padding-bottom-base))",
    },
    "screen and (min-width: 80rem)": {
      paddingBottom: "var(--rc-box-padding-bottom-lg, var(--rc-box-padding-bottom-md, var(--rc-box-padding-bottom-base)))",
    },
  }
});

export const boxPaddingLeft = style({
  paddingLeft: "var(--rc-box-padding-left-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      paddingLeft: "var(--rc-box-padding-left-md, var(--rc-box-padding-left-base))",
    },
    "screen and (min-width: 80rem)": {
      paddingLeft: "var(--rc-box-padding-left-lg, var(--rc-box-padding-left-md, var(--rc-box-padding-left-base)))",
    },
  }
});

export const boxMargin = style({
  margin: "var(--rc-box-margin-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      margin: "var(--rc-box-margin-md, var(--rc-box-margin-base))",
    },
    "screen and (min-width: 80rem)": {
      margin: "var(--rc-box-margin-lg, var(--rc-box-margin-md, var(--rc-box-margin-base)))",
    },
  }
});

export const boxMarginX = style({
  marginLeft: "var(--rc-box-margin-x-base)",
  marginRight: "var(--rc-box-margin-x-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      marginLeft: "var(--rc-box-margin-x-md, var(--rc-box-margin-x-base))",
      marginRight: "var(--rc-box-margin-x-md, var(--rc-box-margin-x-base))",
    },
    "screen and (min-width: 80rem)": {
      marginLeft: "var(--rc-box-margin-x-lg, var(--rc-box-margin-x-md, var(--rc-box-margin-x-base)))",
      marginRight: "var(--rc-box-margin-x-lg, var(--rc-box-margin-x-md, var(--rc-box-margin-x-base)))",
    },
  }
});

export const boxMarginY = style({
  marginTop: "var(--rc-box-margin-y-base)",
  marginBottom: "var(--rc-box-margin-y-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      marginTop: "var(--rc-box-margin-y-md, var(--rc-box-margin-y-base))",
      marginBottom: "var(--rc-box-margin-y-md, var(--rc-box-margin-y-base))",
    },
    "screen and (min-width: 80rem)": {
      marginTop: "var(--rc-box-margin-y-lg, var(--rc-box-margin-y-md, var(--rc-box-margin-y-base)))",
      marginBottom: "var(--rc-box-margin-y-lg, var(--rc-box-margin-y-md, var(--rc-box-margin-y-base)))",
    },
  }
});

export const boxMarginTop = style({
  marginTop: "var(--rc-box-margin-top-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      marginTop: "var(--rc-box-margin-top-md, var(--rc-box-margin-top-base))",
    },
    "screen and (min-width: 80rem)": {
      marginTop: "var(--rc-box-margin-top-lg, var(--rc-box-margin-top-md, var(--rc-box-margin-top-base)))",
    },
  }
});

export const boxMarginRight = style({
  marginRight: "var(--rc-box-margin-right-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      marginRight: "var(--rc-box-margin-right-md, var(--rc-box-margin-right-base))",
    },
    "screen and (min-width: 80rem)": {
      marginRight: "var(--rc-box-margin-right-lg, var(--rc-box-margin-right-md, var(--rc-box-margin-right-base)))",
    },
  }
});

export const boxMarginBottom = style({
  marginBottom: "var(--rc-box-margin-bottom-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      marginBottom: "var(--rc-box-margin-bottom-md, var(--rc-box-margin-bottom-base))",
    },
    "screen and (min-width: 80rem)": {
      marginBottom: "var(--rc-box-margin-bottom-lg, var(--rc-box-margin-bottom-md, var(--rc-box-margin-bottom-base)))",
    },
  }
});

export const boxMarginLeft = style({
  marginLeft: "var(--rc-box-margin-left-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      marginLeft: "var(--rc-box-margin-left-md, var(--rc-box-margin-left-base))",
    },
    "screen and (min-width: 80rem)": {
      marginLeft: "var(--rc-box-margin-left-lg, var(--rc-box-margin-left-md, var(--rc-box-margin-left-base)))",
    },
  }
});

export const boxGap = style({
  gap: "var(--rc-box-gap-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      gap: "var(--rc-box-gap-md, var(--rc-box-gap-base))",
    },
    "screen and (min-width: 80rem)": {
      gap: "var(--rc-box-gap-lg, var(--rc-box-gap-md, var(--rc-box-gap-base)))",
    },
  }
});

export const boxDisplay = style({
  display: "var(--rc-box-display-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      display: "var(--rc-box-display-md, var(--rc-box-display-base))",
    },
    "screen and (min-width: 80rem)": {
      display: "var(--rc-box-display-lg, var(--rc-box-display-md, var(--rc-box-display-base)))",
    },
  }
});

export const boxWidth = style({
  width: "var(--rc-box-width-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      width: "var(--rc-box-width-md, var(--rc-box-width-base))",
    },
    "screen and (min-width: 80rem)": {
      width: "var(--rc-box-width-lg, var(--rc-box-width-md, var(--rc-box-width-base)))",
    },
  }
});

export const boxHeight = style({
  height: "var(--rc-box-height-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      height: "var(--rc-box-height-md, var(--rc-box-height-base))",
    },
    "screen and (min-width: 80rem)": {
      height: "var(--rc-box-height-lg, var(--rc-box-height-md, var(--rc-box-height-base)))",
    },
  }
});

export const boxMinWidth = style({
  minWidth: "var(--rc-box-min-width-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      minWidth: "var(--rc-box-min-width-md, var(--rc-box-min-width-base))",
    },
    "screen and (min-width: 80rem)": {
      minWidth: "var(--rc-box-min-width-lg, var(--rc-box-min-width-md, var(--rc-box-min-width-base)))",
    },
  }
});

export const boxMinHeight = style({
  minHeight: "var(--rc-box-min-height-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      minHeight: "var(--rc-box-min-height-md, var(--rc-box-min-height-base))",
    },
    "screen and (min-width: 80rem)": {
      minHeight: "var(--rc-box-min-height-lg, var(--rc-box-min-height-md, var(--rc-box-min-height-base)))",
    },
  }
});

export const boxMaxWidth = style({
  maxWidth: "var(--rc-box-max-width-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      maxWidth: "var(--rc-box-max-width-md, var(--rc-box-max-width-base))",
    },
    "screen and (min-width: 80rem)": {
      maxWidth: "var(--rc-box-max-width-lg, var(--rc-box-max-width-md, var(--rc-box-max-width-base)))",
    },
  }
});

export const boxMaxHeight = style({
  maxHeight: "var(--rc-box-max-height-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      maxHeight: "var(--rc-box-max-height-md, var(--rc-box-max-height-base))",
    },
    "screen and (min-width: 80rem)": {
      maxHeight: "var(--rc-box-max-height-lg, var(--rc-box-max-height-md, var(--rc-box-max-height-base)))",
    },
  }
});

export const boxBackgroundColor = styleVariants(systemColorsSecondary, (value) => ({ backgroundColor: value }));

export const boxBorderRadius = styleVariants(refRadiusScale, (value) => ({ borderRadius: value }));

export const boxBorder = styleVariants(systemBorderScale, (value) => ({ border: value }));

export const boxBoxShadow = styleVariants(systemElevationScale, (value) => ({ boxShadow: value }));
