import type { ComponentPropsWithoutRef, ReactNode } from "react";
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
