import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  stackAlign,
  stackDirection,
  stackGap,
  stackJustify,
  stackRoot,
  stackWrap,
} from "./Stack.gen.css";
import { systemSpacing, type SystemSpacing as StackSpacingToken } from "../../tokens.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { responsiveVars, type Responsive } from "../../responsive.gen";

export interface StackProps extends CommonComponentProps {
  direction?: Responsive<"row" | "column">;
  gap?: Responsive<StackSpacingToken>;
  align?: Responsive<"start" | "center" | "end" | "stretch" | "baseline">;
  justify?: Responsive<"start" | "center" | "end" | "space-between" | "space-around" | "space-evenly">;
  wrap?: Responsive<boolean>;
  children?: ReactNode;
  render?: RenderProp;
}

const ALIGN_VALUES = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline",
} as const;

const JUSTIFY_VALUES = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  "space-between": "space-between",
  "space-around": "space-around",
  "space-evenly": "space-evenly",
} as const;

export function Stack({
  direction = "column",
  gap,
  align,
  justify,
  wrap,
  className,
  render,
  children,
  ...props
}: StackProps) {
  const classes = [
    stackRoot,
    direction !== undefined && stackDirection,
    wrap !== undefined && stackWrap,
    gap !== undefined && stackGap,
    align !== undefined && stackAlign,
    justify !== undefined && stackJustify,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: Record<string, unknown> = {
    ...responsiveVars("rc-stack-direction", direction, (value: "row" | "column") => value),
    ...responsiveVars("rc-stack-wrap", wrap, (value: boolean) => (value ? "wrap" : "nowrap")),
    ...responsiveVars(
      "rc-stack-align",
      align,
      (value: "start" | "center" | "end" | "stretch" | "baseline") => ALIGN_VALUES[value],
    ),
    ...responsiveVars(
      "rc-stack-justify",
      justify,
      (value: "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly") =>
        JUSTIFY_VALUES[value],
    ),
    ...responsiveVars("rc-stack-gap", gap, (value: StackSpacingToken) => systemSpacing[value]),
  };

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "stack",
    className: classes,
    style,
    children,
  };

  return renderElement("div", render, rootProps as ComponentPropsWithoutRef<"div">);
}
