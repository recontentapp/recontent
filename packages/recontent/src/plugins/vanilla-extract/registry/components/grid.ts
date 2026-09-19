import type { BreakpointBinding, ComponentSourceFiles, ScaleImport } from "../types.js";
import { responsiveRule } from "./shared/responsive.js";

function generateGridSourcesStatic({ spacing }: { spacing: ScaleImport }): ComponentSourceFiles {
  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { ${spacing.exportName} } from "../../tokens.css";

export const gridRoot = style({ display: "grid" });

export const gridGap = styleVariants(${spacing.exportName}, (value) => ({ gap: value }));
export const gridColumnGap = styleVariants(${spacing.exportName}, (value) => ({ columnGap: value }));
export const gridRowGap = styleVariants(${spacing.exportName}, (value) => ({ rowGap: value }));

export const gridAlign = styleVariants({
  start: { alignItems: "start" },
  center: { alignItems: "center" },
  end: { alignItems: "end" },
  stretch: { alignItems: "stretch" },
});

export const gridJustify = styleVariants({
  start: { justifyItems: "start" },
  center: { justifyItems: "center" },
  end: { justifyItems: "end" },
  stretch: { justifyItems: "stretch" },
  "space-between": { justifyContent: "space-between" },
});

export const gridAutoFlow = styleVariants({
  row: { gridAutoFlow: "row" },
  column: { gridAutoFlow: "column" },
  dense: { gridAutoFlow: "dense" },
  "row dense": { gridAutoFlow: "row dense" },
  "column dense": { gridAutoFlow: "column dense" },
});
`,
    component: `import type { CSSProperties, ComponentPropsWithoutRef, ReactNode } from "react";
import {
  gridAlign,
  gridAutoFlow,
  gridColumnGap,
  gridGap,
  gridJustify,
  gridRoot,
  gridRowGap,
} from "./Grid.gen.css";
import type { ${spacing.typeName} as GridSpacingToken } from "../../tokens.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";

export interface GridProps extends CommonComponentProps {
  columns?: number | string;
  rows?: number | string;
  gap?: GridSpacingToken;
  columnGap?: GridSpacingToken;
  rowGap?: GridSpacingToken;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "stretch" | "space-between";
  autoFlow?: "row" | "column" | "dense" | "row dense" | "column dense";
  children?: ReactNode;
  render?: RenderProp;
}

function trackValue(value: number | string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return typeof value === "number" ? \`repeat(\${value}, minmax(0, 1fr))\` : value;
}

export function Grid({
  columns,
  rows,
  gap,
  columnGap,
  rowGap,
  align,
  justify,
  autoFlow,
  className,
  render,
  children,
  ...props
}: GridProps) {
  const classes = [
    gridRoot,
    gap !== undefined && gridGap[gap],
    columnGap !== undefined && gridColumnGap[columnGap],
    rowGap !== undefined && gridRowGap[rowGap],
    align !== undefined && gridAlign[align],
    justify !== undefined && gridJustify[justify],
    autoFlow !== undefined && gridAutoFlow[autoFlow],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties = {
    gridTemplateColumns: trackValue(columns),
    gridTemplateRows: trackValue(rows),
  };

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "grid",
    className: classes,
    style,
    children,
  };

  return renderElement("div", render, rootProps as ComponentPropsWithoutRef<"div">);
}
`,
  };
}

function generateGridSourcesResponsive(
  { spacing }: { spacing: ScaleImport },
  breakpoints: readonly BreakpointBinding[],
): ComponentSourceFiles {
  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { ${spacing.exportName} } from "../../tokens.css";

export const gridRoot = style({ display: "grid" });

${responsiveRule("gridColumns", "rc-grid-columns", ["gridTemplateColumns"], breakpoints)}

${responsiveRule("gridRows", "rc-grid-rows", ["gridTemplateRows"], breakpoints)}

${responsiveRule("gridGap", "rc-grid-gap", ["gap"], breakpoints)}

${responsiveRule("gridColumnGap", "rc-grid-column-gap", ["columnGap"], breakpoints)}

${responsiveRule("gridRowGap", "rc-grid-row-gap", ["rowGap"], breakpoints)}

export const gridAlign = styleVariants({
  start: { alignItems: "start" },
  center: { alignItems: "center" },
  end: { alignItems: "end" },
  stretch: { alignItems: "stretch" },
});

export const gridJustify = styleVariants({
  start: { justifyItems: "start" },
  center: { justifyItems: "center" },
  end: { justifyItems: "end" },
  stretch: { justifyItems: "stretch" },
  "space-between": { justifyContent: "space-between" },
});

export const gridAutoFlow = styleVariants({
  row: { gridAutoFlow: "row" },
  column: { gridAutoFlow: "column" },
  dense: { gridAutoFlow: "dense" },
  "row dense": { gridAutoFlow: "row dense" },
  "column dense": { gridAutoFlow: "column dense" },
});
`,
    component: `import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  gridAlign,
  gridAutoFlow,
  gridColumnGap,
  gridColumns,
  gridGap,
  gridJustify,
  gridRoot,
  gridRowGap,
  gridRows,
} from "./Grid.gen.css";
import { ${spacing.exportName}, type ${spacing.typeName} as GridSpacingToken } from "../../tokens.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { responsiveVars, type Responsive } from "../../responsive.gen";

export interface GridProps extends CommonComponentProps {
  columns?: Responsive<number | string>;
  rows?: Responsive<number | string>;
  gap?: Responsive<GridSpacingToken>;
  columnGap?: Responsive<GridSpacingToken>;
  rowGap?: Responsive<GridSpacingToken>;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "stretch" | "space-between";
  autoFlow?: "row" | "column" | "dense" | "row dense" | "column dense";
  children?: ReactNode;
  render?: RenderProp;
}

function trackValue(value: number | string): string {
  return typeof value === "number" ? \`repeat(\${value}, minmax(0, 1fr))\` : value;
}

export function Grid({
  columns,
  rows,
  gap,
  columnGap,
  rowGap,
  align,
  justify,
  autoFlow,
  className,
  render,
  children,
  ...props
}: GridProps) {
  const classes = [
    gridRoot,
    columns !== undefined && gridColumns,
    rows !== undefined && gridRows,
    gap !== undefined && gridGap,
    columnGap !== undefined && gridColumnGap,
    rowGap !== undefined && gridRowGap,
    align !== undefined && gridAlign[align],
    justify !== undefined && gridJustify[justify],
    autoFlow !== undefined && gridAutoFlow[autoFlow],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: Record<string, unknown> = {
    ...responsiveVars("rc-grid-columns", columns, trackValue),
    ...responsiveVars("rc-grid-rows", rows, trackValue),
    ...responsiveVars("rc-grid-gap", gap, (value: GridSpacingToken) => ${spacing.exportName}[value]),
    ...responsiveVars(
      "rc-grid-column-gap",
      columnGap,
      (value: GridSpacingToken) => ${spacing.exportName}[value],
    ),
    ...responsiveVars("rc-grid-row-gap", rowGap, (value: GridSpacingToken) => ${spacing.exportName}[value]),
  };

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "grid",
    className: classes,
    style,
    children,
  };

  return renderElement("div", render, rootProps as ComponentPropsWithoutRef<"div">);
}
`,
  };
}

export function generateGridSources(
  { spacing }: { spacing: ScaleImport },
  breakpoints: readonly BreakpointBinding[] | undefined,
): ComponentSourceFiles {
  return breakpoints
    ? generateGridSourcesResponsive({ spacing }, breakpoints)
    : generateGridSourcesStatic({ spacing });
}

import type { ScaleBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { vanillaExtractComponentOutput } from "./shared.js";

export type GridComponentOptions = {
  spacing: ScaleBinding<"dimension">;
};

export const gridComponent = defineRegistryComponent<GridComponentOptions>()({
  id: "grid",
  name: "Grid",
  internalDependencies: ["render-element", "responsive"],
  schema: {
    spacing: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the gap, columnGap and rowGap props.",
    },
  },
  output: vanillaExtractComponentOutput("grid", "Grid", (scales, breakpoints) =>
    generateGridSources({ spacing: scales.spacing! }, breakpoints),
  ),
});
