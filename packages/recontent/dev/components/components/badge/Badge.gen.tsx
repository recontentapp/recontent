import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { badgeRoot, badgeVariant } from "./Badge.gen.css";

export type BadgeVariant = keyof typeof badgeVariant;

export type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  variant?: BadgeVariant;
  label: ReactNode;
  icon?: ReactNode;
};

export function Badge({
  variant,
  label,
  icon,
  className,
  ...props
}: BadgeProps) {
  const classes = [badgeRoot, variant && badgeVariant[variant], className]
    .filter(Boolean)
    .join(" ");

  return (
    <span data-slot="badge" data-variant={variant} {...props} className={classes}>
      {icon}
      {label}
    </span>
  );
}
