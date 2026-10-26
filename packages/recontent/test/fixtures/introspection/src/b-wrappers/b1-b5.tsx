import { forwardRef, memo, type Ref } from "react";

function B1Base(props: { label: string; count?: number }) {
  return <span>{props.label}</span>;
}

export const B1 = memo(B1Base);

export const B2 = memo((props: { value: string }) => <i>{props.value}</i>);

type ButtonProps = { label: string; tone?: "a" | "b" };

export const B3 = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
  <button ref={ref}>{props.label}</button>
));

export const B4 = forwardRef(function B4(props: ButtonProps, ref: Ref<HTMLDivElement>) {
  return <div ref={ref}>{props.label}</div>;
});

export const B5 = memo(
  forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
    <button ref={ref}>{props.label}</button>
  )),
);
