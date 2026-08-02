import type { CSSProperties, ComponentPropsWithoutRef, ReactNode } from "react";
import {
  stackItemAlignSelf,
  stackItemBasis,
  stackItemBasisAuto,
  stackItemBasisFull,
  stackItemRoot,
} from "./StackItem.gen.css";
import type { SystemSpacing as StackItemSpacingToken } from "../../tokens.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../shared/Shared.gen";

export interface StackItemProps extends CommonComponentProps {
  grow?: boolean | number;
  shrink?: boolean | number;
  basis?: StackItemSpacingToken | "auto" | "full";
  alignSelf?: "auto" | "start" | "center" | "end" | "stretch" | "baseline";
  order?: number;
  children?: ReactNode;
  render?: RenderProp;
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
    basis === "auto" && stackItemBasisAuto,
    basis === "full" && stackItemBasisFull,
    basis !== undefined && basis !== "auto" && basis !== "full" && stackItemBasis[basis],
    alignSelf !== undefined && stackItemAlignSelf[alignSelf],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties = {
    flexGrow: grow === true ? 1 : grow === false ? 0 : grow,
    flexShrink: shrink === true ? 1 : shrink === false ? 0 : shrink,
    order,
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
