import { style, styleVariants } from "@vanilla-extract/css";
import { systemTextScale, systemColorsTextScale } from "../../tokens.css";

export const textRoot = style({ margin: 0 });

export const textVariantFontFamily = style({
  fontFamily: "var(--rc-text-variant-font-family-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      fontFamily: "var(--rc-text-variant-font-family-md, var(--rc-text-variant-font-family-base))",
    },
    "screen and (min-width: 80rem)": {
      fontFamily: "var(--rc-text-variant-font-family-lg, var(--rc-text-variant-font-family-md, var(--rc-text-variant-font-family-base)))",
    },
  }
});

export const textVariantFontSize = style({
  fontSize: "var(--rc-text-variant-font-size-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      fontSize: "var(--rc-text-variant-font-size-md, var(--rc-text-variant-font-size-base))",
    },
    "screen and (min-width: 80rem)": {
      fontSize: "var(--rc-text-variant-font-size-lg, var(--rc-text-variant-font-size-md, var(--rc-text-variant-font-size-base)))",
    },
  }
});

export const textVariantFontWeight = style({
  fontWeight: "var(--rc-text-variant-font-weight-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      fontWeight: "var(--rc-text-variant-font-weight-md, var(--rc-text-variant-font-weight-base))",
    },
    "screen and (min-width: 80rem)": {
      fontWeight: "var(--rc-text-variant-font-weight-lg, var(--rc-text-variant-font-weight-md, var(--rc-text-variant-font-weight-base)))",
    },
  }
});

export const textVariantLetterSpacing = style({
  letterSpacing: "var(--rc-text-variant-letter-spacing-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      letterSpacing: "var(--rc-text-variant-letter-spacing-md, var(--rc-text-variant-letter-spacing-base))",
    },
    "screen and (min-width: 80rem)": {
      letterSpacing: "var(--rc-text-variant-letter-spacing-lg, var(--rc-text-variant-letter-spacing-md, var(--rc-text-variant-letter-spacing-base)))",
    },
  }
});

export const textVariantLineHeight = style({
  lineHeight: "var(--rc-text-variant-line-height-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      lineHeight: "var(--rc-text-variant-line-height-md, var(--rc-text-variant-line-height-base))",
    },
    "screen and (min-width: 80rem)": {
      lineHeight: "var(--rc-text-variant-line-height-lg, var(--rc-text-variant-line-height-md, var(--rc-text-variant-line-height-base)))",
    },
  }
});

export const textColor = styleVariants(systemColorsTextScale, (value) => ({ color: value }));

export const textAlign = style({
  textAlign: "var(--rc-text-align-base)",
  "@media": {
    "screen and (min-width: 48rem)": {
      textAlign: "var(--rc-text-align-md, var(--rc-text-align-base))",
    },
    "screen and (min-width: 80rem)": {
      textAlign: "var(--rc-text-align-lg, var(--rc-text-align-md, var(--rc-text-align-base)))",
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
