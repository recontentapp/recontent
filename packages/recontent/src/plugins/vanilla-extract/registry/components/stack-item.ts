import type { BreakpointBinding, ComponentSourceFiles, ScaleImport } from "../types.js";
import { responsiveRule } from "./shared/responsive.js";
import type { ScaleBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { vanillaExtractComponentOutput } from "./shared.js";

function generateStackItemSourcesStatic({
  spacing,
}: {
  spacing: ScaleImport;
}): ComponentSourceFiles {
  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { ${spacing.exportName} } from "../../tokens.css";

export const stackItemRoot = style({});

export const stackItemBasis = styleVariants(${spacing.exportName}, (value) => ({ flexBasis: value }));

export const stackItemBasisAuto = style({ flexBasis: "auto" });
export const stackItemBasisFull = style({ flexBasis: "100%" });

export const stackItemAlignSelf = styleVariants({
  auto: { alignSelf: "auto" },
  start: { alignSelf: "flex-start" },
  center: { alignSelf: "center" },
  end: { alignSelf: "flex-end" },
  stretch: { alignSelf: "stretch" },
  baseline: { alignSelf: "baseline" },
});
`,
    component: `import type { CSSProperties, ComponentPropsWithoutRef, ReactNode } from "react";
import {
  stackItemAlignSelf,
  stackItemBasis,
  stackItemBasisAuto,
  stackItemBasisFull,
  stackItemRoot,
} from "./StackItem.gen.css";
import type { ${spacing.typeName} as StackItemSpacingToken } from "../../tokens.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";

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
`,
  };
}

function generateStackItemSourcesResponsive(
  { spacing }: { spacing: ScaleImport },
  breakpoints: readonly BreakpointBinding[],
): ComponentSourceFiles {
  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { ${spacing.exportName} } from "../../tokens.css";

export const stackItemRoot = style({});

${responsiveRule("stackItemBasis", "rc-stack-item-basis", ["flexBasis"], breakpoints)}

${responsiveRule("stackItemGrow", "rc-stack-item-grow", ["flexGrow"], breakpoints)}

${responsiveRule("stackItemShrink", "rc-stack-item-shrink", ["flexShrink"], breakpoints)}

${responsiveRule("stackItemOrder", "rc-stack-item-order", ["order"], breakpoints)}

export const stackItemAlignSelf = styleVariants({
  auto: { alignSelf: "auto" },
  start: { alignSelf: "flex-start" },
  center: { alignSelf: "center" },
  end: { alignSelf: "flex-end" },
  stretch: { alignSelf: "stretch" },
  baseline: { alignSelf: "baseline" },
});
`,
    component: `import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  stackItemAlignSelf,
  stackItemBasis,
  stackItemGrow,
  stackItemOrder,
  stackItemRoot,
  stackItemShrink,
} from "./StackItem.gen.css";
import { ${spacing.exportName}, type ${spacing.typeName} as StackItemSpacingToken } from "../../tokens.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { responsiveVars, type Responsive } from "../../responsive.gen";

export interface StackItemProps extends CommonComponentProps {
  grow?: Responsive<boolean | number>;
  shrink?: Responsive<boolean | number>;
  basis?: Responsive<StackItemSpacingToken | "auto" | "full">;
  alignSelf?: "auto" | "start" | "center" | "end" | "stretch" | "baseline";
  order?: Responsive<number>;
  children?: ReactNode;
  render?: RenderProp;
}

function basisValue(value: StackItemSpacingToken | "auto" | "full"): string {
  if (value === "auto") return "auto";
  if (value === "full") return "100%";
  return ${spacing.exportName}[value];
}

function flexValue(value: boolean | number): number {
  return value === true ? 1 : value === false ? 0 : value;
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
    basis !== undefined && stackItemBasis,
    grow !== undefined && stackItemGrow,
    shrink !== undefined && stackItemShrink,
    order !== undefined && stackItemOrder,
    alignSelf !== undefined && stackItemAlignSelf[alignSelf],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: Record<string, unknown> = {
    ...responsiveVars("rc-stack-item-basis", basis, basisValue),
    ...responsiveVars("rc-stack-item-grow", grow, flexValue),
    ...responsiveVars("rc-stack-item-shrink", shrink, flexValue),
    ...responsiveVars("rc-stack-item-order", order, (value: number) => value),
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
`,
  };
}

function generateStackItemSources(
  { spacing }: { spacing: ScaleImport },
  breakpoints: readonly BreakpointBinding[] | undefined,
): ComponentSourceFiles {
  return breakpoints
    ? generateStackItemSourcesResponsive({ spacing }, breakpoints)
    : generateStackItemSourcesStatic({ spacing });
}

export type StackItemComponentOptions = {
  spacing: ScaleBinding<"dimension">;
};

export const stackItemComponent = defineRegistryComponent<StackItemComponentOptions>()({
  id: "stack-item",
  name: "StackItem",
  internalDependencies: ["render-element", "responsive"],
  schema: {
    spacing: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the StackItem basis prop.",
    },
  },
  output: vanillaExtractComponentOutput("stack-item", "StackItem", (scales, breakpoints) =>
    generateStackItemSources({ spacing: scales.spacing! }, breakpoints),
  ),
});
