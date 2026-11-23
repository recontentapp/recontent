import type {
  ButtonHTMLAttributes,
  ComponentProps,
  InputHTMLAttributes,
  PropsWithChildren,
} from "react";

export interface D1Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: "solid" | "outline";
}

export function D1(props: D1Props) {
  return <button {...props} />;
}

type D2Props = ComponentProps<"button"> & { variant: "solid" | "outline" };

export function D2(props: D2Props) {
  return <button {...props} />;
}

type Size = "sm" | "md" | "lg";

type D3Props = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & { size?: Size };

export function D3(props: D3Props) {
  return <input {...props} size={undefined} />;
}

export function D4(props: PropsWithChildren<{ label: string }>) {
  return <div>{props.children}</div>;
}
