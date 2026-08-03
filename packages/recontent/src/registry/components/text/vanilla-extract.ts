import type { ComponentSourceFiles, ScaleImport } from "../../types.js";

export function generateTextSources({
  typography,
  color,
}: {
  typography: ScaleImport;
  color: ScaleImport;
}): ComponentSourceFiles {
  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { ${typography.exportName}, ${color.exportName} } from "../../tokens.css";

export const textRoot = style({ margin: 0 });

export const textVariant = styleVariants(${typography.exportName}, (value) => value);

export const textColor = styleVariants(${color.exportName}, (value) => ({ color: value }));

export const textAlign = styleVariants({
  left: { textAlign: "left" },
  center: { textAlign: "center" },
  right: { textAlign: "right" },
  justify: { textAlign: "justify" },
});

export const textTransform = styleVariants({
  none: { textTransform: "none" },
  capitalize: { textTransform: "capitalize" },
  uppercase: { textTransform: "uppercase" },
  lowercase: { textTransform: "lowercase" },
  "full-width": { textTransform: "full-width" },
});

export const textTruncate = style({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const textClamp = style({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});
`,
    component: `import type { CSSProperties, ComponentPropsWithoutRef, ReactNode } from "react";
import {
  textAlign,
  textClamp,
  textColor,
  textRoot,
  textTransform,
  textTruncate,
  textVariant,
} from "./Text.gen.css";
import type { ${typography.typeName} as TextVariantToken, ${color.typeName} as TextColorToken } from "../../tokens.css";
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
`,
  };
}
