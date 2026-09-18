import type { ComponentSourceFiles, ScaleImport, TokenImport } from "../../types.js";

export function generateSkeletonSources(bindings: {
  backgroundColor: TokenImport;
  highlightColor: TokenImport;
  radii: ScaleImport;
  circularRadius: TokenImport;
  lineGap: TokenImport;
  animationDuration: TokenImport;
}): ComponentSourceFiles {
  const { backgroundColor, highlightColor, radii, circularRadius, lineGap, animationDuration } =
    bindings;

  return {
    styles: `import { keyframes, style, styleVariants } from "@vanilla-extract/css";
import { ${radii.exportName}, vars } from "../../tokens.css";

const shimmer = keyframes({
  "0%": { backgroundPosition: "150% 0" },
  "100%": { backgroundPosition: "-50% 0" },
});

export const skeletonRoot = style({
  boxSizing: "border-box",
  display: "block",
  backgroundColor: ${backgroundColor.reference},
});

export const skeletonAnimate = style({
  backgroundImage: \`linear-gradient(90deg, transparent, \${${highlightColor.reference}}, transparent)\`,
  backgroundSize: "200% 100%",
  animationName: shimmer,
  animationDuration: ${animationDuration.reference},
  animationIterationCount: "infinite",
  animationTimingFunction: "linear",
});

export const skeletonVariant = styleVariants({
  text: {
    height: "1em",
  },
  circular: {
    borderRadius: ${circularRadius.reference},
  },
  rectangular: {},
});

export const skeletonRadius = styleVariants(${radii.exportName}, (value) => ({ borderRadius: value }));

export const skeletonLines = style({
  display: "flex",
  flexDirection: "column",
  gap: ${lineGap.reference},
});

export const skeletonLastLine = style({
  width: "80%",
});
`,
    component: `import type { CSSProperties, ComponentPropsWithoutRef } from "react";
import {
  skeletonAnimate,
  skeletonLastLine,
  skeletonLines,
  skeletonRadius,
  skeletonRoot,
  skeletonVariant,
} from "./Skeleton.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import type { ${radii.typeName} as RadiusToken } from "../../tokens.css";

export interface SkeletonProps extends CommonComponentProps {
  variant?: "text" | "circular" | "rectangular";
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  radius?: RadiusToken;
  lines?: number;
  animate?: boolean;
  render?: RenderProp<"div">;
}

export function Skeleton({
  variant = "text",
  width,
  height,
  radius,
  lines,
  animate = true,
  className,
  render,
  ...props
}: SkeletonProps) {
  const classes = [
    skeletonRoot,
    skeletonVariant[variant],
    radius !== undefined && skeletonRadius[radius],
    animate && skeletonAnimate,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (variant === "text" && lines && lines > 1) {
    return (
      <div className={skeletonLines} data-slot="skeleton-lines">
        {Array.from({ length: lines }, (_, index) => (
          <span
            key={index}
            className={[classes, index === lines - 1 && skeletonLastLine].filter(Boolean).join(" ")}
            style={{ width, height }}
            data-slot="skeleton"
          />
        ))}
      </div>
    );
  }

  const style: CSSProperties = { width, height };

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "skeleton",
    className: classes,
    style,
  };

  return renderElement("div", render, rootProps as ComponentPropsWithoutRef<"div">);
}
`,
  };
}
