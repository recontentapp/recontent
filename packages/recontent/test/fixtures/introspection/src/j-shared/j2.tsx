import type { BaseProps } from "./base";

export interface J2Props extends BaseProps {
  label: string;
}

export function J2(props: J2Props) {
  return <div>{props.label}</div>;
}
