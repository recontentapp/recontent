import type { ComponentType, SVGProps } from "react";
import { AlertTriangle, Check, ChevronDown, Info, Search, X } from "lucide-react";

export type IconRenderProps = SVGProps<SVGSVGElement>;

// Owned by you: Recontent creates this file once and never overwrites it.
// Swap these placeholders for your icon library (lucide-react, heroicons, ...).
// Each key below comes from an icon name referenced by a built-in component
// option (e.g. Accordion's `indicatorIcon`) in recontent.config.ts.
export const icons = {
  alert: AlertTriangle,
  check: Check,
  chevronDown: ChevronDown,
  close: X,
  info: Info,
  search: Search,
} satisfies Record<string, ComponentType<IconRenderProps>>;

export type IconType = keyof typeof icons;
