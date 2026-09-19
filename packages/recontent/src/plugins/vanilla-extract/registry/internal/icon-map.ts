function iconEntry(name: string): string {
  return `  ${JSON.stringify(name)}: (props: IconRenderProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),`;
}

function generateIconMapSource(iconNames: readonly string[]): string {
  const entries = [...iconNames].sort().map(iconEntry).join("\n");

  return `import type { ComponentType, SVGProps } from "react";

export type IconRenderProps = SVGProps<SVGSVGElement>;

// Owned by you: Recontent creates this file once and never overwrites it.
// Swap these placeholders for your icon library (lucide-react, heroicons, ...).
// Each key below comes from an icon name referenced by a built-in component
// option (e.g. Accordion's \`indicatorIcon\`) in recontent.config.ts.
export const icons = {
${entries}
} satisfies Record<string, ComponentType<IconRenderProps>>;

export type IconType = keyof typeof icons;
`;
}

import type { InternalModuleDefinition } from "../types.js";

export const iconMapModule: InternalModuleDefinition = {
  id: "icon-map",
  output: {
    runtimeDependencies: { react: ">=18" },
    generate: (options?: { iconNames?: readonly string[] }) => [
      {
        filename: "iconMap.tsx",
        content: generateIconMapSource(options?.iconNames ?? []),
        writeMode: "once",
      },
    ],
  },
};
