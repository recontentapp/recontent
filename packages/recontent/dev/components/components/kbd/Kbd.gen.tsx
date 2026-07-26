import type { ComponentPropsWithoutRef } from "react";
import { kbdRoot } from "./Kbd.gen.css";

export type KbdProps = ComponentPropsWithoutRef<"kbd">;

export function Kbd({ className, ...props }: KbdProps) {
  const classes = [kbdRoot, className].filter(Boolean).join(" ");

  return <kbd data-slot="kbd" {...props} className={classes} />;
}
