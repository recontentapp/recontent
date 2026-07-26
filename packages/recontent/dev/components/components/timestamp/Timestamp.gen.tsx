import type { ComponentPropsWithoutRef } from "react";
import { timestampRoot } from "./Timestamp.gen.css";

export type TimestampProps = ComponentPropsWithoutRef<"time">;

export function Timestamp({ className, ...props }: TimestampProps) {
  const classes = [timestampRoot, className].filter(Boolean).join(" ");

  return <time data-slot="timestamp" {...props} className={classes} />;
}
