import type { ButtonHTMLAttributes } from "react";

/** Names an icon of the set. */
export type IconName = "home" | "search";

export type ButtonSize = IconSize;

type IconSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual weight of the button. */
  variant?: "solid" | "outline";
  label: string;
  icon?: IconName;
  size?: ButtonSize;
}

/** Triggers an action. */
export function Button({ variant = "solid", label, ...rest }: ButtonProps) {
  return (
    <button data-variant={variant} {...rest}>
      {label}
    </button>
  );
}
