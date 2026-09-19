import type { BreakpointBinding, ComponentSourceFiles, ScaleImport } from "../types.js";
import { responsiveRule } from "./shared/responsive.js";

function generateTextSourcesStatic({
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

const TYPOGRAPHY_MEMBERS: readonly { key: string; cssProp: string; varSuffix: string }[] = [
  { key: "fontFamily", cssProp: "fontFamily", varSuffix: "font-family" },
  { key: "fontSize", cssProp: "fontSize", varSuffix: "font-size" },
  { key: "fontWeight", cssProp: "fontWeight", varSuffix: "font-weight" },
  { key: "letterSpacing", cssProp: "letterSpacing", varSuffix: "letter-spacing" },
  { key: "lineHeight", cssProp: "lineHeight", varSuffix: "line-height" },
];

function generateTextSourcesResponsive(
  { typography, color }: { typography: ScaleImport; color: ScaleImport },
  breakpoints: readonly BreakpointBinding[],
): ComponentSourceFiles {
  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { ${typography.exportName}, ${color.exportName} } from "../../tokens.css";

export const textRoot = style({ margin: 0 });

${TYPOGRAPHY_MEMBERS.map((member) =>
  responsiveRule(
    `textVariant${member.key[0]!.toUpperCase()}${member.key.slice(1)}`,
    `rc-text-variant-${member.varSuffix}`,
    [member.cssProp],
    breakpoints,
  ),
).join("\n\n")}

export const textColor = styleVariants(${color.exportName}, (value) => ({ color: value }));

${responsiveRule("textAlign", "rc-text-align", ["textAlign"], breakpoints)}

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
${TYPOGRAPHY_MEMBERS.map(
  (member) => `  textVariant${member.key[0]!.toUpperCase()}${member.key.slice(1)},`,
).join("\n")}
} from "./Text.gen.css";
import { ${typography.exportName}, type ${typography.typeName} as TextVariantToken, type ${color.typeName} as TextColorToken } from "../../tokens.css";
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
${TYPOGRAPHY_MEMBERS.map(
  (member) =>
    `    variant !== undefined && textVariant${member.key[0]!.toUpperCase()}${member.key.slice(1)},`,
).join("\n")}
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
${TYPOGRAPHY_MEMBERS.map(
  (member) =>
    `    ...responsiveVars("rc-text-variant-${member.varSuffix}", variant, (value: TextVariantToken) => ${typography.exportName}[value].${member.cssProp}),`,
).join("\n")}
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
`,
  };
}

export function generateTextSources(
  { typography, color }: { typography: ScaleImport; color: ScaleImport },
  breakpoints: readonly BreakpointBinding[] | undefined,
): ComponentSourceFiles {
  return breakpoints
    ? generateTextSourcesResponsive({ typography, color }, breakpoints)
    : generateTextSourcesStatic({ typography, color });
}

import type { ScaleBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { vanillaExtractComponentOutput } from "./shared.js";

export type TextComponentOptions = {
  typography: ScaleBinding<"typography">;
  color: ScaleBinding<"color">;
};

export const textComponent = defineRegistryComponent<TextComponentOptions>()({
  id: "text",
  name: "Text",
  internalDependencies: ["render-element", "responsive"],
  schema: {
    typography: {
      kind: "scale",
      type: "typography",
      description: "Scale used by the variant prop.",
    },
    color: {
      kind: "scale",
      type: "color",
      description: "Scale used by the color prop.",
    },
  },
  output: vanillaExtractComponentOutput("text", "Text", (scales, breakpoints) =>
    generateTextSources(
      {
        typography: scales.typography!,
        color: scales.color!,
      },
      breakpoints,
    ),
  ),
});
