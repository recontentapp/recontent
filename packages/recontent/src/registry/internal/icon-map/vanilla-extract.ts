export function generateIconMapSource(): string {
  return `import type { ComponentType, SVGProps } from "react";

export type IconRenderProps = SVGProps<SVGSVGElement>;

// Owned by you: Recontent creates this file once and never overwrites it.
// Swap these placeholders for your icon library (lucide-react, heroicons, ...);
// every entry's key becomes a valid \`IconType\`.
export const icons = {
  check: (props: IconRenderProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  chevronDown: (props: IconRenderProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  close: (props: IconRenderProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  info: (props: IconRenderProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  alert: (props: IconRenderProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  search: (props: IconRenderProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
} satisfies Record<string, ComponentType<IconRenderProps>>;

export type IconType = keyof typeof icons;
`;
}
