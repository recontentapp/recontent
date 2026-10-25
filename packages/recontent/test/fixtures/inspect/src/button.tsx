import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual weight of the button. */
  variant?: "solid" | "outline";
  label: string;
}

/** Triggers an action. */
export function Button({ variant = "solid", label, ...rest }: ButtonProps) {
  return (
    <button data-variant={variant} {...rest}>
      {label}
    </button>
  );
}
