type A5Props = { size?: "sm" | "md"; label?: string };

export function A5({ size = "md", ...rest }: A5Props) {
  return <span data-size={size}>{rest.label}</span>;
}

export const A6 = ({ label }: { label: string; tone?: "a" | "b" }) => <span>{label}</span>;
