import type { ComponentPropsWithoutRef } from "react";
import { statusDotRoot, statusDotVariant } from "./StatusDot.gen.css";

export type StatusDotStatus = keyof typeof statusDotVariant;

export type StatusDotProps = ComponentPropsWithoutRef<"span"> & {
  status: StatusDotStatus;
};

export function StatusDot({ status, className, ...props }: StatusDotProps) {
  const classes = [
    statusDotRoot,
    statusDotVariant[status],
    className,
  ].filter(Boolean).join(" ");

  return (
    <span data-slot="status-dot" data-status={status} {...props} className={classes} />
  );
}
