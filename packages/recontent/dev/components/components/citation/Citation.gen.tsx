import type { ComponentPropsWithoutRef } from "react";
import { citationRoot } from "./Citation.gen.css";

export type CitationProps = ComponentPropsWithoutRef<"cite">;

export function Citation({ className, ...props }: CitationProps) {
  const classes = [citationRoot, className].filter(Boolean).join(" ");

  return <cite data-slot="citation" {...props} className={classes} />;
}
