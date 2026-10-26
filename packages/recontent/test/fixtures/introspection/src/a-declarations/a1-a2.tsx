export interface A1Props {
  label: string;
  disabled?: boolean;
}

export function A1(props: A1Props) {
  return <button disabled={props.disabled}>{props.label}</button>;
}

type A2Props = { label: string; count?: number };

export const A2 = (props: A2Props) => <span>{props.label}</span>;
