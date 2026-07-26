import { style, styleVariants } from "@vanilla-extract/css";

export const aspectRatioRoot = style({
  position: "relative",
  width: "100%",
  overflow: "clip",
  minHeight: 0,
  flexShrink: 0,
});

export const aspectRatioShape = styleVariants({
  rectangle: {},
  ellipse: { borderRadius: "50%" },
});

export const aspectRatioChild = style({
  position: "absolute",
  top: 0,
  insetInlineStart: 0,
  width: "100%",
  height: "100%",
});

export const aspectRatioChildCenter = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});
