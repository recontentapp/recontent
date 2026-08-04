import type { CSSProperties, ComponentPropsWithoutRef, ReactNode } from "react";
import {
  textAlign,
  textClamp,
  textColor,
  textRoot,
  textTransform,
  textTruncate,
  textVariantFontFamily,
  textVariantFontSize,
  textVariantFontWeight,
  textVariantLetterSpacing,
  textVariantLineHeight,
} from "./Text.gen.css";
import { systemTextScale, type SystemTextScale as TextVariantToken, type SystemColorsTextScale as TextColorToken } from "../../tokens.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { responsiveVars, type Responsive } from "../../responsive.gen";

export interface TextProps extends CommonComponentProps {
  variant?: Responsive<TextVariantToken>;
  color?: TextColorToken;
  align?: Responsive<"left" | "center" | "right" | "justify">;
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
    variant !== undefined && textVariantFontFamily,
    variant !== undefined && textVariantFontSize,
    variant !== undefined && textVariantFontWeight,
    variant !== undefined && textVariantLetterSpacing,
    variant !== undefined && textVariantLineHeight,
    color !== undefined && textColor[color],
    align !== undefined && textAlign,
    textTransformProp !== undefined && textTransform[textTransformProp],
    truncate === true && textTruncate,
    typeof truncate === "number" && textClamp,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: Record<string, unknown> = {
    ...(typeof truncate === "number" ? { WebkitLineClamp: truncate } : {}),
    ...responsiveVars("rc-text-variant-font-family", variant, (value: TextVariantToken) => systemTextScale[value].fontFamily),
    ...responsiveVars("rc-text-variant-font-size", variant, (value: TextVariantToken) => systemTextScale[value].fontSize),
    ...responsiveVars("rc-text-variant-font-weight", variant, (value: TextVariantToken) => systemTextScale[value].fontWeight),
    ...responsiveVars("rc-text-variant-letter-spacing", variant, (value: TextVariantToken) => systemTextScale[value].letterSpacing),
    ...responsiveVars("rc-text-variant-line-height", variant, (value: TextVariantToken) => systemTextScale[value].lineHeight),
    ...responsiveVars(
      "rc-text-align",
      align,
      (value: "left" | "center" | "right" | "justify") => value,
    ),
  };

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "text",
    className: classes,
    style,
    children,
  };

  return renderElement("p", render, rootProps as ComponentPropsWithoutRef<"p">);
}
