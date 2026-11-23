import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

const buttonVariants = cva("btn", {
  variants: {
    variant: { solid: "", outline: "" },
    size: { sm: "", md: "" },
  },
  defaultVariants: { variant: "solid" },
});

type E1Props = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function E1({ className, variant, size, asChild, ...props }: E1Props) {
  return (
    <button className={buttonVariants({ variant, size, className })} {...props} data-as={asChild} />
  );
}
