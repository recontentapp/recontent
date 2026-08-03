import { style, styleVariants } from "@vanilla-extract/css";
import { systemTextScale, systemColorsTextScale } from "../../tokens.css";

export const textRoot = style({ margin: 0 });

export const textVariant = styleVariants(systemTextScale, (value) => value);

export const textColor = styleVariants(systemColorsTextScale, (value) => ({ color: value }));

export const textAlign = styleVariants({
  left: { textAlign: "left" },
  center: { textAlign: "center" },
  right: { textAlign: "right" },
  justify: { textAlign: "justify" },
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
