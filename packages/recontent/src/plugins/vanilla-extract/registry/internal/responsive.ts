import type { BreakpointBinding, InternalModuleDefinition } from "../types.js";

export function generateResponsiveSource(breakpoints: readonly BreakpointBinding[]): string {
  const names = breakpoints.map((breakpoint) => JSON.stringify(breakpoint.name));
  const breakpointUnion = names.join(" | ");
  const breakpointList = `[${names.join(", ")}] as const`;
  const baseBreakpoint = names[0]!;

  return `export type Breakpoint = ${breakpointUnion};
export type Responsive<T> = T | { [K in Breakpoint]?: T };

const BREAKPOINTS = ${breakpointList};
const BASE_BREAKPOINT = ${baseBreakpoint};

function isResponsiveObject<T>(
  value: T | { [K in Breakpoint]?: T },
): value is { [K in Breakpoint]?: T } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Flattens a \`Responsive<T>\` prop value into \`--\${prefix}-<breakpoint>\`
 * custom properties. Handles the scalar case (equivalent to
 * \`{ ${JSON.parse(baseBreakpoint)}: value }\`) so component bodies have a single code path.
 * Returns \`undefined\` for an undefined prop so it can be spread into a style
 * object without adding keys.
 */
export function responsiveVars<T, V extends string | number>(
  prefix: string,
  value: Responsive<T> | undefined,
  map: (value: T) => V,
): Record<string, V> | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!isResponsiveObject<T>(value)) {
    return { [\`--\${prefix}-\${BASE_BREAKPOINT}\`]: map(value) };
  }
  const result: Record<string, V> = {};
  for (const breakpoint of BREAKPOINTS) {
    const breakpointValue = value[breakpoint];
    if (breakpointValue !== undefined) {
      result[\`--\${prefix}-\${breakpoint}\`] = map(breakpointValue);
    }
  }
  return result;
}
`;
}

export const responsiveModule: InternalModuleDefinition = {
  id: "responsive",
  output: {
    runtimeDependencies: {},
    generate: (options?: { breakpoints?: readonly BreakpointBinding[] }) => {
      const breakpoints = options?.breakpoints;
      if (!breakpoints || breakpoints.length === 0) {
        return [];
      }
      return [
        {
          filename: "responsive.gen.ts",
          content: generateResponsiveSource(breakpoints),
        },
      ];
    },
  },
};
