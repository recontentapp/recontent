import type { ComponentSourceFiles } from "../../types.js";

export function generateAspectRatioSources(): ComponentSourceFiles {
  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";

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
`,
    component: `import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  aspectRatioChild,
  aspectRatioChildCenter,
  aspectRatioRoot,
  aspectRatioShape,
} from "./AspectRatio.gen.css";

export type AspectRatioShape = "rectangle" | "ellipse";
export type AspectRatioFit = "cover" | "contain" | "center";

export type AspectRatioProps = ComponentPropsWithoutRef<"div"> & {
  ratio: number;
  shape?: AspectRatioShape;
  fit?: AspectRatioFit;
  children: ReactNode;
};

export function AspectRatio({
  ratio,
  shape = "rectangle",
  fit,
  children,
  className,
  style,
  ...props
}: AspectRatioProps) {
  const classes = [
    aspectRatioRoot,
    aspectRatioShape[shape],
    className,
  ].filter(Boolean).join(" ");
  const childClasses = [
    aspectRatioChild,
    fit === "center" && aspectRatioChildCenter,
  ].filter(Boolean).join(" ");

  return (
    <div
      data-slot="aspect-ratio"
      data-shape={shape}
      {...props}
      className={classes}
      style={{ ...style, aspectRatio: ratio }}
    >
      <div data-astryx-aspect-ratio-override={fit} className={childClasses}>
        {children}
      </div>
    </div>
  );
}
`,
  };
}
