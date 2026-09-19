import type { BreakpointBinding, ComponentSourceFiles, ScaleImport } from "../types.js";
import { responsiveRule } from "./shared/responsive.js";

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

// Free-form (non-token) responsive props: identity-mapped straight to a CSS var.
const FREE_FORM_VARIANTS: readonly SpacingVariant[] = [
  { name: "display", cssProps: ["display"] },
  { name: "width", cssProps: ["width"] },
  { name: "height", cssProps: ["height"] },
  { name: "minWidth", cssProps: ["minWidth"] },
  { name: "minHeight", cssProps: ["minHeight"] },
  { name: "maxWidth", cssProps: ["maxWidth"] },
  { name: "maxHeight", cssProps: ["maxHeight"] },
];

function capitalize(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function kebabCase(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function spacingVariantExport(variant: SpacingVariant, spacing: ScaleImport): string {
  const style = variant.cssProps.map((cssProp) => `${cssProp}: value`).join(", ");
  return `export const box${capitalize(variant.name)} = styleVariants(${spacing.exportName}, (value) => ({ ${style} }));`;
}

function generateBoxSourcesStatic({
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
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";

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

function generateBoxSourcesResponsive(
  {
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
  },
  breakpoints: readonly BreakpointBinding[],
): ComponentSourceFiles {
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

  const allResponsiveVariants = [...SPACING_VARIANTS, ...FREE_FORM_VARIANTS];

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { ${valueImports} } from "../../tokens.css";

export const boxRoot = style({});

${allResponsiveVariants
  .map((variant) =>
    responsiveRule(
      `box${capitalize(variant.name)}`,
      `rc-box-${kebabCase(variant.name)}`,
      variant.cssProps,
      breakpoints,
    ),
  )
  .join("\n\n")}

export const boxBackgroundColor = styleVariants(${surface.exportName}, (value) => ({ backgroundColor: value }));

export const boxBorderRadius = styleVariants(${radius.exportName}, (value) => ({ borderRadius: value }));

export const boxBorder = styleVariants(${border.exportName}, (value) => ({ border: value }));

export const boxBoxShadow = styleVariants(${boxShadow.exportName}, (value) => ({ boxShadow: value }));
`,
    component: `import type { CSSProperties, ComponentPropsWithoutRef, ReactNode } from "react";
import {
${allResponsiveVariants.map((variant) => `  box${capitalize(variant.name)},`).join("\n")}
  boxBackgroundColor,
  boxBorder,
  boxBorderRadius,
  boxBoxShadow,
  boxRoot,
} from "./Box.gen.css";
import { ${spacing.exportName} } from "../../tokens.css";
import type { ${typeImports} } from "../../tokens.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { responsiveVars, type Responsive } from "../../responsive.gen";

export interface BoxProps extends CommonComponentProps {
${SPACING_VARIANTS.map((variant) => `  ${variant.name}?: Responsive<BoxSpacingToken>;`).join("\n")}
  backgroundColor?: BoxSurfaceToken;
  borderRadius?: BoxRadiusToken;
  border?: BoxBorderToken;
  boxShadow?: BoxElevationToken;
  display?: Responsive<"block" | "inline-block" | "inline" | "flex" | "inline-flex" | "grid" | "none">;
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  width?: Responsive<CSSProperties["width"]>;
  height?: Responsive<CSSProperties["height"]>;
  minWidth?: Responsive<CSSProperties["minWidth"]>;
  minHeight?: Responsive<CSSProperties["minHeight"]>;
  maxWidth?: Responsive<CSSProperties["maxWidth"]>;
  maxHeight?: Responsive<CSSProperties["maxHeight"]>;
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
${SPACING_VARIANTS.map((variant) => `    ${variant.name} !== undefined && box${capitalize(variant.name)},`).join("\n")}
    display !== undefined && boxDisplay,
    width !== undefined && boxWidth,
    height !== undefined && boxHeight,
    minWidth !== undefined && boxMinWidth,
    minHeight !== undefined && boxMinHeight,
    maxWidth !== undefined && boxMaxWidth,
    maxHeight !== undefined && boxMaxHeight,
    backgroundColor !== undefined && boxBackgroundColor[backgroundColor],
    borderRadius !== undefined && boxBorderRadius[borderRadius],
    border !== undefined && boxBorder[border],
    boxShadow !== undefined && boxBoxShadow[boxShadow],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: Record<string, unknown> = {
    position,
    overflow,
${SPACING_VARIANTS.map(
  (variant) =>
    `    ...responsiveVars("rc-box-${kebabCase(variant.name)}", ${variant.name}, (value: BoxSpacingToken) => ${spacing.exportName}[value]),`,
).join("\n")}
    ...responsiveVars("rc-box-display", display, (value) => value as string),
    ...responsiveVars("rc-box-width", width, (value) => value as string | number),
    ...responsiveVars("rc-box-height", height, (value) => value as string | number),
    ...responsiveVars("rc-box-min-width", minWidth, (value) => value as string | number),
    ...responsiveVars("rc-box-min-height", minHeight, (value) => value as string | number),
    ...responsiveVars("rc-box-max-width", maxWidth, (value) => value as string | number),
    ...responsiveVars("rc-box-max-height", maxHeight, (value) => value as string | number),
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

function generateBoxSources(
  bindings: {
    spacing: ScaleImport;
    surface: ScaleImport;
    radius: ScaleImport;
    border: ScaleImport;
    boxShadow: ScaleImport;
  },
  breakpoints: readonly BreakpointBinding[] | undefined,
): ComponentSourceFiles {
  return breakpoints
    ? generateBoxSourcesResponsive(bindings, breakpoints)
    : generateBoxSourcesStatic(bindings);
}

import type { ScaleBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { vanillaExtractComponentOutput } from "./shared.js";

export type BoxComponentOptions = {
  spacing: ScaleBinding<"dimension">;
  surface: ScaleBinding<"color">;
  radius: ScaleBinding<"dimension">;
  border: ScaleBinding<"border">;
  boxShadow: ScaleBinding<"shadow">;
};

export const boxComponent = defineRegistryComponent<BoxComponentOptions>()({
  id: "box",
  name: "Box",
  internalDependencies: ["render-element", "responsive"],
  schema: {
    spacing: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by padding, margin and gap props.",
    },
    surface: {
      kind: "scale",
      type: "color",
      description: "Scale used by the backgroundColor prop.",
    },
    radius: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the borderRadius prop.",
    },
    border: {
      kind: "scale",
      type: "border",
      description: "Scale used by the border prop.",
    },
    boxShadow: {
      kind: "scale",
      type: "shadow",
      description: "Scale used by the boxShadow prop.",
    },
  },
  output: vanillaExtractComponentOutput("box", "Box", (scales, breakpoints) =>
    generateBoxSources(
      {
        spacing: scales.spacing!,
        surface: scales.surface!,
        radius: scales.radius!,
        border: scales.border!,
        boxShadow: scales.boxShadow!,
      },
      breakpoints,
    ),
  ),
});
