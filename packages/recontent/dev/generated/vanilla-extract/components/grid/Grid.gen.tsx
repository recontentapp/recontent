import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  gridAlign,
  gridAutoFlow,
  gridColumnGap,
  gridColumns,
  gridGap,
  gridJustify,
  gridRoot,
  gridRowGap,
  gridRows,
} from "./Grid.gen.css";
import { systemSpacing, type SystemSpacing as GridSpacingToken } from "../../tokens.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { responsiveVars, type Responsive } from "../../responsive.gen";

export interface GridProps extends CommonComponentProps {
  columns?: Responsive<number | string>;
  rows?: Responsive<number | string>;
  gap?: Responsive<GridSpacingToken>;
  columnGap?: Responsive<GridSpacingToken>;
  rowGap?: Responsive<GridSpacingToken>;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "stretch" | "space-between";
  autoFlow?: "row" | "column" | "dense" | "row dense" | "column dense";
  children?: ReactNode;
  render?: RenderProp;
}

function trackValue(value: number | string): string {
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
    columns !== undefined && gridColumns,
    rows !== undefined && gridRows,
    gap !== undefined && gridGap,
    columnGap !== undefined && gridColumnGap,
    rowGap !== undefined && gridRowGap,
    align !== undefined && gridAlign[align],
    justify !== undefined && gridJustify[justify],
    autoFlow !== undefined && gridAutoFlow[autoFlow],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: Record<string, unknown> = {
    ...responsiveVars("rc-grid-columns", columns, trackValue),
    ...responsiveVars("rc-grid-rows", rows, trackValue),
    ...responsiveVars("rc-grid-gap", gap, (value: GridSpacingToken) => systemSpacing[value]),
    ...responsiveVars(
      "rc-grid-column-gap",
      columnGap,
      (value: GridSpacingToken) => systemSpacing[value],
    ),
    ...responsiveVars("rc-grid-row-gap", rowGap, (value: GridSpacingToken) => systemSpacing[value]),
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
