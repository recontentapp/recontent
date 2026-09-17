import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  stackItemAlignSelf,
  stackItemBasis,
  stackItemGrow,
  stackItemOrder,
  stackItemRoot,
  stackItemShrink,
} from "./StackItem.gen.css";
import { systemSpacing, type SystemSpacing as StackItemSpacingToken } from "../../tokens.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { responsiveVars, type Responsive } from "../../responsive.gen";

export interface StackItemProps extends CommonComponentProps {
  grow?: Responsive<boolean | number>;
  shrink?: Responsive<boolean | number>;
  basis?: Responsive<StackItemSpacingToken | "auto" | "full">;
  alignSelf?: "auto" | "start" | "center" | "end" | "stretch" | "baseline";
  order?: Responsive<number>;
  children?: ReactNode;
  render?: RenderProp;
}

function basisValue(value: StackItemSpacingToken | "auto" | "full"): string {
  if (value === "auto") return "auto";
  if (value === "full") return "100%";
  return systemSpacing[value];
}

function flexValue(value: boolean | number): number {
  return value === true ? 1 : value === false ? 0 : value;
}

export function StackItem({
  grow,
  shrink,
  basis,
  alignSelf,
  order,
  className,
  render,
  children,
  ...props
}: StackItemProps) {
  const classes = [
    stackItemRoot,
    basis !== undefined && stackItemBasis,
    grow !== undefined && stackItemGrow,
    shrink !== undefined && stackItemShrink,
    order !== undefined && stackItemOrder,
    alignSelf !== undefined && stackItemAlignSelf[alignSelf],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: Record<string, unknown> = {
    ...responsiveVars("rc-stack-item-basis", basis, basisValue),
    ...responsiveVars("rc-stack-item-grow", grow, flexValue),
    ...responsiveVars("rc-stack-item-shrink", shrink, flexValue),
    ...responsiveVars("rc-stack-item-order", order, (value: number) => value),
  };

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "stack-item",
    className: classes,
    style,
    children,
  };

  return renderElement("div", render, rootProps as ComponentPropsWithoutRef<"div">);
}
