import type { MouseEventHandler } from "react";

type Width = number | "100%" | "auto" | (string & {});

export function D14(props: { width?: Width; onClick?: MouseEventHandler<HTMLButtonElement> }) {
  return <button style={{ width: props.width }} onClick={props.onClick} />;
}

export function D15<Value extends string, Fallback = Value>(props: {
  value: Value;
  fallback?: Fallback;
}) {
  return <div>{props.value}</div>;
}
