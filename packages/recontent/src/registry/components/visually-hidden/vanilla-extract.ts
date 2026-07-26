import type { ComponentSourceFiles } from "../../types.js";

export function generateVisuallyHiddenSources(): ComponentSourceFiles {
  return {
    styles: `import { style } from "@vanilla-extract/css";

export const visuallyHidden = style({
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
});
`,
    component: `import type { ComponentPropsWithoutRef } from "react";
import { visuallyHidden } from "./VisuallyHidden.gen.css";

export type VisuallyHiddenProps = ComponentPropsWithoutRef<"span">;

export function VisuallyHidden({ className, ...props }: VisuallyHiddenProps) {
  const classes = [visuallyHidden, className].filter(Boolean).join(" ");

  return <span data-slot="visually-hidden" {...props} className={classes} />;
}
`,
  };
}
