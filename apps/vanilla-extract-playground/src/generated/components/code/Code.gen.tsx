import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { codeRoot } from "./Code.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";

export interface CodeProps extends CommonComponentProps {
  children?: ReactNode;
  render?: RenderProp<"code">;
}

export function Code({ className, render, children, ...props }: CodeProps) {
  const classes = [codeRoot, className].filter(Boolean).join(" ");

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "code",
    className: classes,
    children,
  };

  return renderElement("code", render, rootProps as ComponentPropsWithoutRef<"code">);
}
