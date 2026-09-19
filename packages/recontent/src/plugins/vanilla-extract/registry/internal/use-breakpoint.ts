import type { BreakpointBinding, InternalModuleDefinition } from "../types.js";

function generateUseBreakpointSource(breakpoints: readonly BreakpointBinding[]): string {
  const breakpointUnion = breakpoints
    .map((breakpoint) => JSON.stringify(breakpoint.name))
    .join(" | ");
  const order = `[${breakpoints.map((breakpoint) => JSON.stringify(breakpoint.name)).join(", ")}] as const`;
  const queries = breakpoints
    .filter((breakpoint) => breakpoint.query !== null)
    .map(
      (breakpoint) => `  ${JSON.stringify(breakpoint.name)}: ${JSON.stringify(breakpoint.query)},`,
    )
    .join("\n");
  const base = JSON.stringify(breakpoints[0]!.name);

  return `import { useSyncExternalStore } from "react";

export type Breakpoint = ${breakpointUnion};

const QUERIES: Partial<Record<Breakpoint, string>> = {
${queries}
};

const ORDER = ${order};

function subscribeAll(onChange: () => void): () => void {
  const queries = Object.values(QUERIES).map((query) => matchMedia(query));
  for (const mql of queries) {
    mql.addEventListener("change", onChange);
  }
  return () => {
    for (const mql of queries) {
      mql.removeEventListener("change", onChange);
    }
  };
}

function currentBreakpoint(): Breakpoint {
  let current: Breakpoint = ${base};
  for (const breakpoint of ORDER) {
    const query = QUERIES[breakpoint];
    if (query && matchMedia(query).matches) {
      current = breakpoint;
    }
  }
  return current;
}

function getServerSnapshot(): Breakpoint {
  return ${base};
}

/**
 * The current breakpoint, for choosing *what* to render (e.g. Dialog vs
 * Drawer). Not for styling — styling has the \`Responsive<T>\` object syntax,
 * which is SSR-correct where this is not, and which does not re-render on
 * resize.
 */
export function useBreakpoint(): Breakpoint {
  return useSyncExternalStore(subscribeAll, currentBreakpoint, getServerSnapshot);
}

/**
 * Whether \`breakpoint\`'s condition currently matches the viewport.
 */
export function useMediaQuery(breakpoint: Breakpoint): boolean {
  const query = QUERIES[breakpoint];
  return useSyncExternalStore(
    (onChange) => {
      if (!query) {
        return () => {};
      }
      const mql = matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => (query ? matchMedia(query).matches : true),
    () => !query,
  );
}
`;
}

export const useBreakpointModule: InternalModuleDefinition = {
  id: "use-breakpoint",
  output: {
    runtimeDependencies: { react: ">=18" },
    generate: (options?: { breakpoints?: readonly BreakpointBinding[] }) => {
      const breakpoints = options?.breakpoints;
      if (!breakpoints || breakpoints.length === 0) {
        return [];
      }
      return [
        {
          filename: "useBreakpoint.gen.ts",
          content: generateUseBreakpointSource(breakpoints),
        },
      ];
    },
  },
};
