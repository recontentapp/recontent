function iconEntry(name: string): string {
  return `  ${JSON.stringify(name)}: (props: IconRenderProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),`;
}

export function generateIconMapSource(iconNames: readonly string[]): string {
  const entries = [...iconNames].sort().map(iconEntry).join("\n");

  return `import type { ComponentType, SVGProps } from "react";

export type IconRenderProps = SVGProps<SVGSVGElement>;

// Owned by you: Recontent creates this file once and never overwrites it.
// Swap these placeholders for your icon library (lucide-react, heroicons, ...).
// Each key below comes from the \`icons\` list in recontent.config.ts.
export const icons = {
${entries}
} satisfies Record<string, ComponentType<IconRenderProps>>;

export type IconType = keyof typeof icons;
`;
}
