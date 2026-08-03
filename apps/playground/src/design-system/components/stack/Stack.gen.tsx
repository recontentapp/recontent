import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  stackAlign,
  stackDirectionColumn,
  stackDirectionRow,
  stackGap,
  stackJustify,
  stackRoot,
  stackWrap,
} from "./Stack.gen.css";
import type { SystemSpacing as StackSpacingToken } from "../../tokens.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";

export interface StackProps extends CommonComponentProps {
  direction?: "row" | "column";
  gap?: StackSpacingToken;
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly";
  wrap?: boolean;
  children?: ReactNode;
  render?: RenderProp;
}

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
    direction === "row" ? stackDirectionRow : stackDirectionColumn,
    wrap && stackWrap,
    gap !== undefined && stackGap[gap],
    align && stackAlign[align],
    justify && stackJustify[justify],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "stack",
    className: classes,
    children,
  };

  return renderElement("div", render, rootProps as ComponentPropsWithoutRef<"div">);
}
