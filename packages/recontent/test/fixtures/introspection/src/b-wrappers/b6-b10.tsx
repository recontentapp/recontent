import { forwardRef, lazy, type ComponentType, type ReactElement, type Ref } from "react";

export function B6({ ref, ...rest }: { label: string } & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} defaultValue={rest.label} />;
}

type ButtonProps = { label: string; tone?: "a" | "b" };

export const B7 = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
  <button ref={ref}>{props.label}</button>
)) as unknown as (props: ButtonProps & { as?: "button" }) => ReactElement;

function B8Base(props: { theme?: string; label: string }) {
  return <span data-theme={props.theme}>{props.label}</span>;
}

function withTheme<P extends { theme?: string }>(
  component: ComponentType<P>,
): ComponentType<Omit<P, "theme">> {
  return component as never;
}

export const B8 = withTheme(B8Base);

export const B9 = lazy(() => import("./heavy"));

export const B10 = forwardRef<HTMLDivElement, { label: string }>((props, ref) => (
  <div ref={ref}>{props.label}</div>
));
B10.displayName = "B10";
