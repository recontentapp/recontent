import type { CSSProperties, ComponentPropsWithoutRef, ReactNode } from "react";
import {
  gridAlign,
  gridAutoFlow,
  gridColumnGap,
  gridGap,
  gridJustify,
  gridRoot,
  gridRowGap,
} from "./Grid.gen.css";
import type { SystemSpacing as GridSpacingToken } from "../../tokens.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";

export interface GridProps extends CommonComponentProps {
  columns?: number | string;
  rows?: number | string;
  gap?: GridSpacingToken;
  columnGap?: GridSpacingToken;
  rowGap?: GridSpacingToken;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "stretch" | "space-between";
  autoFlow?: "row" | "column" | "dense" | "row dense" | "column dense";
  children?: ReactNode;
  render?: RenderProp;
}

function trackValue(value: number | string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return typeof value === "number" ? `repeat(${value}, minmax(0, 1fr))` : value;
}

export function Grid({
  columns,
  rows,
  gap,
  columnGap,
  rowGap,
  align,
  justify,
  autoFlow,
  className,
  render,
  children,
  ...props
}: GridProps) {
  const classes = [
    gridRoot,
    gap !== undefined && gridGap[gap],
    columnGap !== undefined && gridColumnGap[columnGap],
    rowGap !== undefined && gridRowGap[rowGap],
    align !== undefined && gridAlign[align],
    justify !== undefined && gridJustify[justify],
    autoFlow !== undefined && gridAutoFlow[autoFlow],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties = {
    gridTemplateColumns: trackValue(columns),
    gridTemplateRows: trackValue(rows),
  };

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "grid",
    className: classes,
    style,
    children,
  };

  return renderElement("div", render, rootProps as ComponentPropsWithoutRef<"div">);
}
