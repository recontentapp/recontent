import type { ComponentPropsWithoutRef } from "react";
import { dividerOrientation, dividerRoot } from "./Divider.gen.css";

export type DividerOrientation = "horizontal" | "vertical";

export type DividerProps = ComponentPropsWithoutRef<"div"> & {
  orientation?: DividerOrientation;
  decorative?: boolean;
};

export function Divider({
  orientation = "horizontal",
  decorative = true,
  className,
  ...props
}: DividerProps) {
  const classes = [
    dividerRoot,
    dividerOrientation[orientation],
    className,
  ].filter(Boolean).join(" ");

  return (
    <div
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      data-slot="divider"
      data-orientation={orientation}
      {...props}
      className={classes}
    />
  );
}
