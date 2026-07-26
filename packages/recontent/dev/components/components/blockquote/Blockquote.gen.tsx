import type { ComponentPropsWithoutRef } from "react";
import { blockquoteRoot } from "./Blockquote.gen.css";

export type BlockquoteProps = ComponentPropsWithoutRef<"blockquote">;

export function Blockquote({ className, ...props }: BlockquoteProps) {
  const classes = [blockquoteRoot, className].filter(Boolean).join(" ");

  return <blockquote data-slot="blockquote" {...props} className={classes} />;
}
