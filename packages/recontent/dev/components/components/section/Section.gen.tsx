import type { ComponentPropsWithoutRef } from "react";
import { sectionRoot } from "./Section.gen.css";

export type SectionProps = ComponentPropsWithoutRef<"section">;

export function Section({ className, ...props }: SectionProps) {
  const classes = [sectionRoot, className].filter(Boolean).join(" ");

  return <section data-slot="section" {...props} className={classes} />;
}
