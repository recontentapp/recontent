import type { ComponentSourceFiles, ScaleImport } from "../../types.js";

export function generateGridSources({ gapScale }: { gapScale: ScaleImport }): ComponentSourceFiles {
  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { ${gapScale.exportName} } from "../../tokens.css";

export const gridRoot = style({
  display: "grid",
  minWidth: 0,
});

export const gridGap = styleVariants(${gapScale.exportName}, (value) => ({
  gap: value,
}));
`,
    component: `import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import { gridGap, gridRoot } from "./Grid.gen.css";
import type { ${gapScale.typeName} } from "../../tokens.css";

export type GridProps = ComponentPropsWithoutRef<"div"> & {
  columns?: number;
  gap?: ${gapScale.typeName};
};

export function Grid({
  columns = 1,
  gap,
  className,
  style,
  ...props
}: GridProps) {
  const classes = [gridRoot, gap && gridGap[gap], className]
    .filter(Boolean)
    .join(" ");
  const gridStyle: CSSProperties = {
    gridTemplateColumns: \`repeat(\${columns}, minmax(0, 1fr))\`,
    ...style,
  };

  return <div data-slot="grid" {...props} className={classes} style={gridStyle} />;
}
`,
  };
}
