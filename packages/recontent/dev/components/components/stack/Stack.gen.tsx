import type { ComponentPropsWithoutRef } from "react";
import { stackGap, stackRoot } from "./Stack.gen.css";
import type { SystemSpacing } from "../../tokens.css";

export type StackProps = ComponentPropsWithoutRef<"div"> & {
  gap?: SystemSpacing;
};

export function Stack({ gap, className, ...props }: StackProps) {
  const classes = [stackRoot, gap && stackGap[gap], className]
    .filter(Boolean)
    .join(" ");

  return <div data-slot="stack" {...props} className={classes} />;
}
