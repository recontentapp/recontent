import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import { gridSpanRoot } from "./GridSpan.gen.css";

export type GridSpanProps = ComponentPropsWithoutRef<"div"> & {
  columnSpan?: number;
  rowSpan?: number;
};

export function GridSpan({
  columnSpan = 1,
  rowSpan = 1,
  className,
  style,
  ...props
}: GridSpanProps) {
  const classes = [gridSpanRoot, className].filter(Boolean).join(" ");
  const spanStyle: CSSProperties = {
    gridColumn: `span ${columnSpan} / span ${columnSpan}`,
    gridRow: `span ${rowSpan} / span ${rowSpan}`,
    ...style,
  };

  return <div data-slot="grid-span" {...props} className={classes} style={spanStyle} />;
}
