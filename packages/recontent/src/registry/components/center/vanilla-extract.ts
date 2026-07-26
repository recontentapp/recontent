import type { ComponentSourceFiles } from "../../types.js";

export function generateCenterSources(): ComponentSourceFiles {
  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";

export const centerRoot = style({ display: "flex" });

export const centerInline = style({ display: "inline-flex" });

export const centerAxis = styleVariants({
  both: { alignItems: "center", justifyContent: "center" },
  horizontal: { justifyContent: "center" },
  vertical: { alignItems: "center" },
});
`,
    component: `import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import { centerAxis, centerInline, centerRoot } from "./Center.gen.css";

export type CenterAxis = "both" | "horizontal" | "vertical";

export type CenterProps = ComponentPropsWithoutRef<"div"> & {
  axis?: CenterAxis;
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  maxWidth?: CSSProperties["maxWidth"];
  minHeight?: CSSProperties["minHeight"];
  isInline?: boolean;
  children: ReactNode;
};

export function Center({
  axis = "both",
  width,
  height,
  maxWidth,
  minHeight,
  isInline = false,
  children,
  className,
  style,
  ...props
}: CenterProps) {
  const classes = [
    centerRoot,
    isInline && centerInline,
    centerAxis[axis],
    className,
  ].filter(Boolean).join(" ");

  return (
    <div
      data-slot="center"
      data-axis={axis}
      {...props}
      className={classes}
      style={{ width, height, maxWidth, minHeight, ...style }}
    >
      {children}
    </div>
  );
}
`,
  };
}
