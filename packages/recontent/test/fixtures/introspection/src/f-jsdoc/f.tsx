/** Primary action */
export function F1(props: {
  /** What the button says */
  label: string;
}) {
  return <button>{props.label}</button>;
}

export function F2(props: {
  /** @default "md" */
  size?: "sm" | "md";
}) {
  return <span>{props.size}</span>;
}

export function F3({
  size = "md",
}: {
  /** @default "lg" */
  size?: "sm" | "md" | "lg";
}) {
  return <span>{size}</span>;
}

/** @deprecated */
export function F4(props: {
  /** @deprecated Use tone instead */
  legacy?: boolean;
  tone?: string;
}) {
  return <span>{props.tone}</span>;
}

interface F5Base {
  /** Kept through Omit */
  title: string;
  other?: number;
}

export function F5(props: Omit<F5Base, "other"> & { extra?: boolean }) {
  return <span>{props.title}</span>;
}
