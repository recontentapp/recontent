import type { CSSProperties, ComponentPropsWithoutRef, ReactNode } from "react";
import {
  textAlign,
  textClamp,
  textColor,
  textRoot,
  textTransform,
  textTruncate,
  textVariant,
} from "./Text.gen.css";
import type { SystemTextScale as TextVariantToken, SystemColorsTextScale as TextColorToken } from "../../tokens.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";

export interface TextProps extends CommonComponentProps {
  variant?: TextVariantToken;
  color?: TextColorToken;
  align?: "left" | "center" | "right" | "justify";
  truncate?: boolean | number;
  textTransform?: "none" | "capitalize" | "uppercase" | "lowercase" | "full-width";
  children?: ReactNode;
  render?: RenderProp<"p">;
}

export function Text({
  variant,
  color,
  align,
  truncate,
  textTransform: textTransformProp,
  className,
  render,
  children,
  ...props
}: TextProps) {
  const classes = [
    textRoot,
    variant !== undefined && textVariant[variant],
    color !== undefined && textColor[color],
    align !== undefined && textAlign[align],
    textTransformProp !== undefined && textTransform[textTransformProp],
    truncate === true && textTruncate,
    typeof truncate === "number" && textClamp,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties =
    typeof truncate === "number" ? { WebkitLineClamp: truncate } : {};

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "text",
    className: classes,
    style,
    children,
  };

  return renderElement("p", render, rootProps as ComponentPropsWithoutRef<"p">);
}
