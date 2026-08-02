import type { ComponentSourceFiles, ScaleImport } from "../../types.js";

type SpacingVariant = { name: string; cssProps: readonly string[] };

const SPACING_VARIANTS: readonly SpacingVariant[] = [
  { name: "padding", cssProps: ["padding"] },
  { name: "paddingX", cssProps: ["paddingLeft", "paddingRight"] },
  { name: "paddingY", cssProps: ["paddingTop", "paddingBottom"] },
  { name: "paddingTop", cssProps: ["paddingTop"] },
  { name: "paddingRight", cssProps: ["paddingRight"] },
  { name: "paddingBottom", cssProps: ["paddingBottom"] },
  { name: "paddingLeft", cssProps: ["paddingLeft"] },
  { name: "margin", cssProps: ["margin"] },
  { name: "marginX", cssProps: ["marginLeft", "marginRight"] },
  { name: "marginY", cssProps: ["marginTop", "marginBottom"] },
  { name: "marginTop", cssProps: ["marginTop"] },
  { name: "marginRight", cssProps: ["marginRight"] },
  { name: "marginBottom", cssProps: ["marginBottom"] },
  { name: "marginLeft", cssProps: ["marginLeft"] },
  { name: "gap", cssProps: ["gap"] },
];

function capitalize(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function spacingVariantExport(variant: SpacingVariant, spacing: ScaleImport): string {
  const style = variant.cssProps.map((cssProp) => `${cssProp}: value`).join(", ");
  return `export const box${capitalize(variant.name)} = styleVariants(${spacing.exportName}, (value) => ({ ${style} }));`;
}

export function generateBoxSources({
  spacing,
  surface,
  radius,
  border,
  boxShadow,
}: {
  spacing: ScaleImport;
  surface: ScaleImport;
  radius: ScaleImport;
  border: ScaleImport;
  boxShadow: ScaleImport;
}): ComponentSourceFiles {
  const valueImports = [
    spacing.exportName,
    surface.exportName,
    radius.exportName,
    border.exportName,
    boxShadow.exportName,
  ]
    .filter((name, index, imports) => imports.indexOf(name) === index)
    .join(", ");

  const typeImports = [
    `${spacing.typeName} as BoxSpacingToken`,
    `${surface.typeName} as BoxSurfaceToken`,
    `${radius.typeName} as BoxRadiusToken`,
    `${border.typeName} as BoxBorderToken`,
    `${boxShadow.typeName} as BoxElevationToken`,
  ].join(", ");

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { ${valueImports} } from "../../tokens.css";

export const boxRoot = style({});

${SPACING_VARIANTS.map((variant) => spacingVariantExport(variant, spacing)).join("\n\n")}

export const boxBackgroundColor = styleVariants(${surface.exportName}, (value) => ({ backgroundColor: value }));

export const boxBorderRadius = styleVariants(${radius.exportName}, (value) => ({ borderRadius: value }));

export const boxBorder = styleVariants(${border.exportName}, (value) => ({ border: value }));

export const boxBoxShadow = styleVariants(${boxShadow.exportName}, (value) => ({ boxShadow: value }));
`,
    component: `import type { CSSProperties, ComponentPropsWithoutRef, ReactNode } from "react";
import {
${SPACING_VARIANTS.map((variant) => `  box${capitalize(variant.name)},`).join("\n")}
  boxBackgroundColor,
  boxBorder,
  boxBorderRadius,
  boxBoxShadow,
  boxRoot,
} from "./Box.gen.css";
import type { ${typeImports} } from "../../tokens.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../shared/Shared.gen";

export interface BoxProps extends CommonComponentProps {
${SPACING_VARIANTS.map((variant) => `  ${variant.name}?: BoxSpacingToken;`).join("\n")}
  backgroundColor?: BoxSurfaceToken;
  borderRadius?: BoxRadiusToken;
  border?: BoxBorderToken;
  boxShadow?: BoxElevationToken;
  display?: "block" | "inline-block" | "inline" | "flex" | "inline-flex" | "grid" | "none";
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  minWidth?: CSSProperties["minWidth"];
  minHeight?: CSSProperties["minHeight"];
  maxWidth?: CSSProperties["maxWidth"];
  maxHeight?: CSSProperties["maxHeight"];
  overflow?: CSSProperties["overflow"];
  children?: ReactNode;
  render?: RenderProp;
}

export function Box({
${SPACING_VARIANTS.map((variant) => `  ${variant.name},`).join("\n")}
  backgroundColor,
  borderRadius,
  border,
  boxShadow,
  display,
  position,
  width,
  height,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  overflow,
  className,
  render,
  children,
  ...props
}: BoxProps) {
  const classes = [
    boxRoot,
${SPACING_VARIANTS.map((variant) => `    ${variant.name} !== undefined && box${capitalize(variant.name)}[${variant.name}],`).join("\n")}
    backgroundColor !== undefined && boxBackgroundColor[backgroundColor],
    borderRadius !== undefined && boxBorderRadius[borderRadius],
    border !== undefined && boxBorder[border],
    boxShadow !== undefined && boxBoxShadow[boxShadow],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties = {
    display,
    position,
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    overflow,
  };

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "box",
    className: classes,
    style,
    children,
  };

  return renderElement("div", render, rootProps as ComponentPropsWithoutRef<"div">);
}
`,
  };
}
