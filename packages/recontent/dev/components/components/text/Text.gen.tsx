import type { ComponentPropsWithoutRef } from "react";
import { textRoot } from "./Text.gen.css";

export type TextElement = "p" | "span" | "div";

export type TextProps = ComponentPropsWithoutRef<"p"> & {
  as?: TextElement;
};

export function Text({ as: Tag = "p", className, ...props }: TextProps) {
  const classes = [textRoot, className].filter(Boolean).join(" ");

  return <Tag data-slot="text" {...props} className={classes} />;
}
