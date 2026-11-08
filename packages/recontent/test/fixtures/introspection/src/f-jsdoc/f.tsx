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

export interface F6Options {
  dense?: boolean;
}

/**
 * Lists things.
 *
 * @usage Use for short lists, configured with {@link F6Options}.
 * Not for tables, see {@link Nope}.
 *
 * @example <caption>Basic</caption>
 * <F6 />
 *
 * @example
 * ```tsx
 * <F6
 *   options={{ dense: true }}
 * />
 * ```
 *
 * @category Data display
 * @deprecated Use {@link F7} instead
 */
export function F6(props: {
  /**
   * Layout options
   * @example { dense: true }
   */
  options?: F6Options;
}) {
  return <ul>{String(props.options?.dense)}</ul>;
}

/**
 * @category Data display
 * @experimental Subject to change.
 */
export function F7(props: {
  /** @experimental */
  rows?: number;
}) {
  return <ul>{props.rows}</ul>;
}

/**
 * @example <caption>From file</caption> ./F8.example.tsx
 * @example ./missing.tsx
 */
export function F8(props: { rows?: number }) {
  return <ul>{props.rows}</ul>;
}
