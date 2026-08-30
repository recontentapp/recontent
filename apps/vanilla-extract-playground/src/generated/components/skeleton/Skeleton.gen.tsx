import type { CSSProperties, ComponentPropsWithoutRef } from "react";
import {
  skeletonAnimate,
  skeletonLastLine,
  skeletonLines,
  skeletonRadius,
  skeletonRoot,
  skeletonVariant,
} from "./Skeleton.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import type { RefRadius as RadiusToken } from "../../tokens.css";

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
