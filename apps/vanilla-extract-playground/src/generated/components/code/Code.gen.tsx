import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { codeRoot } from "./Code.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";

export interface CodeProps extends CommonComponentProps {
  children?: ReactNode;
  render?: RenderProp<"code">;
}

/**
 * Inline snippet of code, in a monospace font.
 *
 * @usage Use for short identifiers, commands and values inside text.
 *
 * @example
 * <Text>
 *   Run <Code>npm install</Code> first.
 * </Text>
 *
 * @category Content
 */
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
