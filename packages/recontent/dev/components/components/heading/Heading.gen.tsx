import type { ComponentPropsWithoutRef } from "react";
import { headingLevel, headingRoot } from "./Heading.gen.css";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type HeadingProps = ComponentPropsWithoutRef<"h1"> & {
  level?: HeadingLevel;
};

export function Heading({ level = 2, className, ...props }: HeadingProps) {
  const Tag = `h${level}` as "h1";
  const classes = [
    headingRoot,
    headingLevel[level],
    className,
  ].filter(Boolean).join(" ");

  return <Tag data-slot="heading" data-level={level} {...props} className={classes} />;
}
