import type { ComponentPropsWithoutRef } from "react";
import { visuallyHidden } from "./VisuallyHidden.gen.css";

export type VisuallyHiddenProps = ComponentPropsWithoutRef<"span">;

export function VisuallyHidden({ className, ...props }: VisuallyHiddenProps) {
  const classes = [visuallyHidden, className].filter(Boolean).join(" ");

  return <span data-slot="visually-hidden" {...props} className={classes} />;
}
