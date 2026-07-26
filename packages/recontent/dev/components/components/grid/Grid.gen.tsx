import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import { gridGap, gridRoot } from "./Grid.gen.css";
import type { SystemSpacing } from "../../tokens.css";

export type GridProps = ComponentPropsWithoutRef<"div"> & {
  columns?: number;
  gap?: SystemSpacing;
};

export function Grid({
  columns = 1,
  gap,
  className,
  style,
  ...props
}: GridProps) {
  const classes = [gridRoot, gap && gridGap[gap], className]
    .filter(Boolean)
    .join(" ");
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    ...style,
  };

  return <div data-slot="grid" {...props} className={classes} style={gridStyle} />;
}
