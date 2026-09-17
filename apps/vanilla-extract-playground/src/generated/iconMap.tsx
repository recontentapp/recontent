import type { ComponentType, SVGProps } from "react";

export type IconRenderProps = SVGProps<SVGSVGElement>;

// Owned by you: Recontent creates this file once and never overwrites it.
// Swap these placeholders for your icon library (lucide-react, heroicons, ...).
// Each key below comes from an icon name referenced by a built-in component
// option (e.g. Accordion's `indicatorIcon`) in recontent.config.ts.
export const icons = {
  alert: (props: IconRenderProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  check: (props: IconRenderProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  chevronDown: (props: IconRenderProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  close: (props: IconRenderProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  info: (props: IconRenderProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  search: (props: IconRenderProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
} satisfies Record<string, ComponentType<IconRenderProps>>;

export type IconType = keyof typeof icons;
