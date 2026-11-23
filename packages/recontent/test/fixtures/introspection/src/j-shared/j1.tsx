import type { BaseProps } from "./base";

export interface J1Props extends BaseProps {
  /** J1's own prop. */
  kind?: "x" | "y";
}

export function J1(props: J1Props) {
  return <div>{props.kind}</div>;
}
