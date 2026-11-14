import type { ReactNode } from "react";

// PascalCase, but a number is not a component.
export function Count(): number {
  return 1;
}

export type Child = ReactNode;
