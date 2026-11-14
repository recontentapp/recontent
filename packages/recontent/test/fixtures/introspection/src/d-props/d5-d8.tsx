export function D5(props: {
  s: "a" | "b";
  n: 1 | 2 | 3;
  b: true | "auto";
  m?: "x" | undefined;
  flag: boolean;
  plain: string;
}) {
  return <div>{props.plain}</div>;
}

type Density = "dense" | "comfy" | "roomy";

export function D6(props: { density?: Density }) {
  return <div>{props.density}</div>;
}

type D7Props = { as: "a"; href: string } | { as: "button"; onClick(): void };

export function D7(props: D7Props) {
  return <div>{props.as}</div>;
}

interface SelectProps<T> {
  options: T[];
  value: T;
  onChange(value: T): void;
}

export function D8<T>(props: SelectProps<T>) {
  return <div>{props.options.length}</div>;
}
