import type { CSSProperties, ComponentPropsWithoutRef, ElementType } from "react";
import type { D11Props } from "@/types";

type D9Props<C extends ElementType> = { as?: C; tone?: "a" | "b" } & Omit<
  ComponentPropsWithoutRef<C>,
  "as" | "tone"
>;

export function D9<C extends ElementType = "div">(props: D9Props<C>) {
  return <div>{props.tone}</div>;
}

interface BaseFieldProps {
  label: string;
  hint?: string;
}

interface TextFieldProps extends BaseFieldProps {
  placeholder?: string;
}

export function D10(props: TextFieldProps) {
  return <label>{props.label}</label>;
}

export function D11(props: D11Props) {
  return <h1>{props.title}</h1>;
}

export function D12(props: { onChange: (value: string) => void; style?: CSSProperties }) {
  return <div style={props.style} onClick={() => props.onChange("")} />;
}

export function D13() {
  return <hr />;
}
