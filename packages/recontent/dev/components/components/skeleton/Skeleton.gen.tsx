import type { ComponentPropsWithoutRef } from "react";
import { skeletonRoot } from "./Skeleton.gen.css";

export type SkeletonProps = ComponentPropsWithoutRef<"div">;

export function Skeleton({ className, ...props }: SkeletonProps) {
  const classes = [skeletonRoot, className].filter(Boolean).join(" ");

  return <div data-slot="skeleton" {...props} className={classes} />;
}
