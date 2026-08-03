import type { ComponentSourceFiles, ScaleImport } from "../../types.js";

export function generateStackSources({ spacing }: { spacing: ScaleImport }): ComponentSourceFiles {
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
