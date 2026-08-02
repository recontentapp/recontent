import { style, styleVariants } from "@vanilla-extract/css";
import { systemSpacing, systemColorsSecondary, refRadiusScale, systemBorderScale, systemElevationScale } from "../../tokens.css";

export const boxRoot = style({});

export const boxPadding = styleVariants(systemSpacing, (value) => ({ padding: value }));

export const boxPaddingX = styleVariants(systemSpacing, (value) => ({ paddingLeft: value, paddingRight: value }));

export const boxPaddingY = styleVariants(systemSpacing, (value) => ({ paddingTop: value, paddingBottom: value }));

export const boxPaddingTop = styleVariants(systemSpacing, (value) => ({ paddingTop: value }));

export const boxPaddingRight = styleVariants(systemSpacing, (value) => ({ paddingRight: value }));

export const boxPaddingBottom = styleVariants(systemSpacing, (value) => ({ paddingBottom: value }));

export const boxPaddingLeft = styleVariants(systemSpacing, (value) => ({ paddingLeft: value }));

export const boxMargin = styleVariants(systemSpacing, (value) => ({ margin: value }));

export const boxMarginX = styleVariants(systemSpacing, (value) => ({ marginLeft: value, marginRight: value }));

export const boxMarginY = styleVariants(systemSpacing, (value) => ({ marginTop: value, marginBottom: value }));

export const boxMarginTop = styleVariants(systemSpacing, (value) => ({ marginTop: value }));

export const boxMarginRight = styleVariants(systemSpacing, (value) => ({ marginRight: value }));

export const boxMarginBottom = styleVariants(systemSpacing, (value) => ({ marginBottom: value }));

export const boxMarginLeft = styleVariants(systemSpacing, (value) => ({ marginLeft: value }));

export const boxGap = styleVariants(systemSpacing, (value) => ({ gap: value }));

export const boxBackgroundColor = styleVariants(systemColorsSecondary, (value) => ({ backgroundColor: value }));

export const boxBorderRadius = styleVariants(refRadiusScale, (value) => ({ borderRadius: value }));

export const boxBorder = styleVariants(systemBorderScale, (value) => ({ border: value }));

export const boxBoxShadow = styleVariants(systemElevationScale, (value) => ({ boxShadow: value }));
