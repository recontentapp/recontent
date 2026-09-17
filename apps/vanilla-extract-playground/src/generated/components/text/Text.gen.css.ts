import { style, styleVariants } from "@vanilla-extract/css";
import { systemTextScale, systemColorsTextScale } from "../../tokens.css";

export const textRoot = style({ margin: 0 });

export const textVariantFontFamily = style({
  fontFamily: "var(--rc-text-variant-font-family-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      fontFamily: "var(--rc-text-variant-font-family-sm, var(--rc-text-variant-font-family-xs))",
    },
    "screen and (min-width: 768px)": {
      fontFamily: "var(--rc-text-variant-font-family-md, var(--rc-text-variant-font-family-sm, var(--rc-text-variant-font-family-xs)))",
    },
    "screen and (min-width: 992px)": {
      fontFamily: "var(--rc-text-variant-font-family-lg, var(--rc-text-variant-font-family-md, var(--rc-text-variant-font-family-sm, var(--rc-text-variant-font-family-xs))))",
    },
    "screen and (min-width: 1200px)": {
      fontFamily: "var(--rc-text-variant-font-family-xl, var(--rc-text-variant-font-family-lg, var(--rc-text-variant-font-family-md, var(--rc-text-variant-font-family-sm, var(--rc-text-variant-font-family-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      fontFamily: "var(--rc-text-variant-font-family-xxl, var(--rc-text-variant-font-family-xl, var(--rc-text-variant-font-family-lg, var(--rc-text-variant-font-family-md, var(--rc-text-variant-font-family-sm, var(--rc-text-variant-font-family-xs))))))",
    },
  }
});

export const textVariantFontSize = style({
  fontSize: "var(--rc-text-variant-font-size-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      fontSize: "var(--rc-text-variant-font-size-sm, var(--rc-text-variant-font-size-xs))",
    },
    "screen and (min-width: 768px)": {
      fontSize: "var(--rc-text-variant-font-size-md, var(--rc-text-variant-font-size-sm, var(--rc-text-variant-font-size-xs)))",
    },
    "screen and (min-width: 992px)": {
      fontSize: "var(--rc-text-variant-font-size-lg, var(--rc-text-variant-font-size-md, var(--rc-text-variant-font-size-sm, var(--rc-text-variant-font-size-xs))))",
    },
    "screen and (min-width: 1200px)": {
      fontSize: "var(--rc-text-variant-font-size-xl, var(--rc-text-variant-font-size-lg, var(--rc-text-variant-font-size-md, var(--rc-text-variant-font-size-sm, var(--rc-text-variant-font-size-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      fontSize: "var(--rc-text-variant-font-size-xxl, var(--rc-text-variant-font-size-xl, var(--rc-text-variant-font-size-lg, var(--rc-text-variant-font-size-md, var(--rc-text-variant-font-size-sm, var(--rc-text-variant-font-size-xs))))))",
    },
  }
});

export const textVariantFontWeight = style({
  fontWeight: "var(--rc-text-variant-font-weight-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      fontWeight: "var(--rc-text-variant-font-weight-sm, var(--rc-text-variant-font-weight-xs))",
    },
    "screen and (min-width: 768px)": {
      fontWeight: "var(--rc-text-variant-font-weight-md, var(--rc-text-variant-font-weight-sm, var(--rc-text-variant-font-weight-xs)))",
    },
    "screen and (min-width: 992px)": {
      fontWeight: "var(--rc-text-variant-font-weight-lg, var(--rc-text-variant-font-weight-md, var(--rc-text-variant-font-weight-sm, var(--rc-text-variant-font-weight-xs))))",
    },
    "screen and (min-width: 1200px)": {
      fontWeight: "var(--rc-text-variant-font-weight-xl, var(--rc-text-variant-font-weight-lg, var(--rc-text-variant-font-weight-md, var(--rc-text-variant-font-weight-sm, var(--rc-text-variant-font-weight-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      fontWeight: "var(--rc-text-variant-font-weight-xxl, var(--rc-text-variant-font-weight-xl, var(--rc-text-variant-font-weight-lg, var(--rc-text-variant-font-weight-md, var(--rc-text-variant-font-weight-sm, var(--rc-text-variant-font-weight-xs))))))",
    },
  }
});

export const textVariantLetterSpacing = style({
  letterSpacing: "var(--rc-text-variant-letter-spacing-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      letterSpacing: "var(--rc-text-variant-letter-spacing-sm, var(--rc-text-variant-letter-spacing-xs))",
    },
    "screen and (min-width: 768px)": {
      letterSpacing: "var(--rc-text-variant-letter-spacing-md, var(--rc-text-variant-letter-spacing-sm, var(--rc-text-variant-letter-spacing-xs)))",
    },
    "screen and (min-width: 992px)": {
      letterSpacing: "var(--rc-text-variant-letter-spacing-lg, var(--rc-text-variant-letter-spacing-md, var(--rc-text-variant-letter-spacing-sm, var(--rc-text-variant-letter-spacing-xs))))",
    },
    "screen and (min-width: 1200px)": {
      letterSpacing: "var(--rc-text-variant-letter-spacing-xl, var(--rc-text-variant-letter-spacing-lg, var(--rc-text-variant-letter-spacing-md, var(--rc-text-variant-letter-spacing-sm, var(--rc-text-variant-letter-spacing-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      letterSpacing: "var(--rc-text-variant-letter-spacing-xxl, var(--rc-text-variant-letter-spacing-xl, var(--rc-text-variant-letter-spacing-lg, var(--rc-text-variant-letter-spacing-md, var(--rc-text-variant-letter-spacing-sm, var(--rc-text-variant-letter-spacing-xs))))))",
    },
  }
});

export const textVariantLineHeight = style({
  lineHeight: "var(--rc-text-variant-line-height-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      lineHeight: "var(--rc-text-variant-line-height-sm, var(--rc-text-variant-line-height-xs))",
    },
    "screen and (min-width: 768px)": {
      lineHeight: "var(--rc-text-variant-line-height-md, var(--rc-text-variant-line-height-sm, var(--rc-text-variant-line-height-xs)))",
    },
    "screen and (min-width: 992px)": {
      lineHeight: "var(--rc-text-variant-line-height-lg, var(--rc-text-variant-line-height-md, var(--rc-text-variant-line-height-sm, var(--rc-text-variant-line-height-xs))))",
    },
    "screen and (min-width: 1200px)": {
      lineHeight: "var(--rc-text-variant-line-height-xl, var(--rc-text-variant-line-height-lg, var(--rc-text-variant-line-height-md, var(--rc-text-variant-line-height-sm, var(--rc-text-variant-line-height-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      lineHeight: "var(--rc-text-variant-line-height-xxl, var(--rc-text-variant-line-height-xl, var(--rc-text-variant-line-height-lg, var(--rc-text-variant-line-height-md, var(--rc-text-variant-line-height-sm, var(--rc-text-variant-line-height-xs))))))",
    },
  }
});

export const textColor = styleVariants(systemColorsTextScale, (value) => ({ color: value }));

export const textAlign = style({
  textAlign: "var(--rc-text-align-xs)",
  "@media": {
    "screen and (min-width: 576px)": {
      textAlign: "var(--rc-text-align-sm, var(--rc-text-align-xs))",
    },
    "screen and (min-width: 768px)": {
      textAlign: "var(--rc-text-align-md, var(--rc-text-align-sm, var(--rc-text-align-xs)))",
    },
    "screen and (min-width: 992px)": {
      textAlign: "var(--rc-text-align-lg, var(--rc-text-align-md, var(--rc-text-align-sm, var(--rc-text-align-xs))))",
    },
    "screen and (min-width: 1200px)": {
      textAlign: "var(--rc-text-align-xl, var(--rc-text-align-lg, var(--rc-text-align-md, var(--rc-text-align-sm, var(--rc-text-align-xs)))))",
    },
    "screen and (min-width: 1800px)": {
      textAlign: "var(--rc-text-align-xxl, var(--rc-text-align-xl, var(--rc-text-align-lg, var(--rc-text-align-md, var(--rc-text-align-sm, var(--rc-text-align-xs))))))",
    },
  }
});

export const textTransform = styleVariants({
  none: { textTransform: "none" },
  capitalize: { textTransform: "capitalize" },
  uppercase: { textTransform: "uppercase" },
  lowercase: { textTransform: "lowercase" },
  "full-width": { textTransform: "full-width" },
});

export const textTruncate = style({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const textClamp = style({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});
