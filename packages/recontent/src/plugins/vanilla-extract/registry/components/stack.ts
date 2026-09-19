import type { BreakpointBinding, ComponentSourceFiles, ScaleImport } from "../types.js";
import { responsiveRule } from "./shared/responsive.js";

function generateStackSourcesStatic({ spacing }: { spacing: ScaleImport }): ComponentSourceFiles {
  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { ${spacing.exportName} } from "../../tokens.css";

export const stackRoot = style({ display: "flex" });

export const stackDirectionRow = style({ flexDirection: "row" });
export const stackDirectionColumn = style({ flexDirection: "column" });

export const stackWrap = style({ flexWrap: "wrap" });

export const stackAlign = styleVariants({
  start: { alignItems: "flex-start" },
  center: { alignItems: "center" },
  end: { alignItems: "flex-end" },
  stretch: { alignItems: "stretch" },
  baseline: { alignItems: "baseline" },
});

export const stackJustify = styleVariants({
  start: { justifyContent: "flex-start" },
  center: { justifyContent: "center" },
  end: { justifyContent: "flex-end" },
  "space-between": { justifyContent: "space-between" },
  "space-around": { justifyContent: "space-around" },
  "space-evenly": { justifyContent: "space-evenly" },
});

export const stackGap = styleVariants(${spacing.exportName}, (value) => ({ gap: value }));
`,
    component: `import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  stackAlign,
  stackDirectionColumn,
  stackDirectionRow,
  stackGap,
  stackJustify,
  stackRoot,
  stackWrap,
} from "./Stack.gen.css";
import type { ${spacing.typeName} as StackSpacingToken } from "../../tokens.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";

export interface StackProps extends CommonComponentProps {
  direction?: "row" | "column";
  gap?: StackSpacingToken;
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly";
  wrap?: boolean;
  children?: ReactNode;
  render?: RenderProp;
}

export function Stack({
  direction = "column",
  gap,
  align,
  justify,
  wrap,
  className,
  render,
  children,
  ...props
}: StackProps) {
  const classes = [
    stackRoot,
    direction === "row" ? stackDirectionRow : stackDirectionColumn,
    wrap && stackWrap,
    gap !== undefined && stackGap[gap],
    align && stackAlign[align],
    justify && stackJustify[justify],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "stack",
    className: classes,
    children,
  };

  return renderElement("div", render, rootProps as ComponentPropsWithoutRef<"div">);
}
`,
  };
}

function generateStackSourcesResponsive(
  { spacing }: { spacing: ScaleImport },
  breakpoints: readonly BreakpointBinding[],
): ComponentSourceFiles {
  return {
    styles: `import { style } from "@vanilla-extract/css";
import { ${spacing.exportName} } from "../../tokens.css";

export const stackRoot = style({ display: "flex" });

${responsiveRule("stackDirection", "rc-stack-direction", ["flexDirection"], breakpoints)}

${responsiveRule("stackWrap", "rc-stack-wrap", ["flexWrap"], breakpoints)}

${responsiveRule("stackAlign", "rc-stack-align", ["alignItems"], breakpoints)}

${responsiveRule("stackJustify", "rc-stack-justify", ["justifyContent"], breakpoints)}

${responsiveRule("stackGap", "rc-stack-gap", ["gap"], breakpoints)}
`,
    component: `import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  stackAlign,
  stackDirection,
  stackGap,
  stackJustify,
  stackRoot,
  stackWrap,
} from "./Stack.gen.css";
import { ${spacing.exportName}, type ${spacing.typeName} as StackSpacingToken } from "../../tokens.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { responsiveVars, type Responsive } from "../../responsive.gen";

export interface StackProps extends CommonComponentProps {
  direction?: Responsive<"row" | "column">;
  gap?: Responsive<StackSpacingToken>;
  align?: Responsive<"start" | "center" | "end" | "stretch" | "baseline">;
  justify?: Responsive<"start" | "center" | "end" | "space-between" | "space-around" | "space-evenly">;
  wrap?: Responsive<boolean>;
  children?: ReactNode;
  render?: RenderProp;
}

const ALIGN_VALUES = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline",
} as const;

const JUSTIFY_VALUES = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  "space-between": "space-between",
  "space-around": "space-around",
  "space-evenly": "space-evenly",
} as const;

export function Stack({
  direction = "column",
  gap,
  align,
  justify,
  wrap,
  className,
  render,
  children,
  ...props
}: StackProps) {
  const classes = [
    stackRoot,
    direction !== undefined && stackDirection,
    wrap !== undefined && stackWrap,
    gap !== undefined && stackGap,
    align !== undefined && stackAlign,
    justify !== undefined && stackJustify,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: Record<string, unknown> = {
    ...responsiveVars("rc-stack-direction", direction, (value: "row" | "column") => value),
    ...responsiveVars("rc-stack-wrap", wrap, (value: boolean) => (value ? "wrap" : "nowrap")),
    ...responsiveVars(
      "rc-stack-align",
      align,
      (value: "start" | "center" | "end" | "stretch" | "baseline") => ALIGN_VALUES[value],
    ),
    ...responsiveVars(
      "rc-stack-justify",
      justify,
      (value: "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly") =>
        JUSTIFY_VALUES[value],
    ),
    ...responsiveVars("rc-stack-gap", gap, (value: StackSpacingToken) => ${spacing.exportName}[value]),
  };

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "stack",
    className: classes,
    style,
    children,
  };

  return renderElement("div", render, rootProps as ComponentPropsWithoutRef<"div">);
}
`,
  };
}

function generateStackSources(
  { spacing }: { spacing: ScaleImport },
  breakpoints: readonly BreakpointBinding[] | undefined,
): ComponentSourceFiles {
  return breakpoints
    ? generateStackSourcesResponsive({ spacing }, breakpoints)
    : generateStackSourcesStatic({ spacing });
}

import type { ScaleBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { vanillaExtractComponentOutput } from "./shared.js";

export type StackComponentOptions = {
  spacing: ScaleBinding<"dimension">;
};

export const stackComponent = defineRegistryComponent<StackComponentOptions>()({
  id: "stack",
  name: "Stack",
  internalDependencies: ["render-element", "responsive"],
  schema: {
    spacing: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the Stack gap prop.",
    },
  },
  output: vanillaExtractComponentOutput("stack", "Stack", (scales, breakpoints) =>
    generateStackSources({ spacing: scales.spacing! }, breakpoints),
  ),
});
