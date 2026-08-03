import { style, styleVariants } from "@vanilla-extract/css";
import { refFontSizeScale, systemColorsTextScale } from "../../tokens.css";

export const iconRoot = style({ display: "inline-block", flexShrink: 0 });

export const iconSize = styleVariants(refFontSizeScale, (value) => ({ width: value, height: value }));

export const iconColor = styleVariants(systemColorsTextScale, (value) => ({ color: value }));
