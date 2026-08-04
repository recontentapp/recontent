import { useSyncExternalStore } from "react";

export type Breakpoint = "base" | "md" | "lg";

const QUERIES: Partial<Record<Breakpoint, string>> = {
  "md": "screen and (min-width: 48rem)",
  "lg": "screen and (min-width: 80rem)",
};

const ORDER = ["base", "md", "lg"] as const;

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
  let current: Breakpoint = "base";
  for (const breakpoint of ORDER) {
    const query = QUERIES[breakpoint];
    if (query && matchMedia(query).matches) {
      current = breakpoint;
    }
  }
  return current;
}

function getServerSnapshot(): Breakpoint {
  return "base";
}

/**
 * The current breakpoint, for choosing *what* to render (e.g. Dialog vs
 * Drawer). Not for styling — styling has the `Responsive<T>` object syntax,
 * which is SSR-correct where this is not, and which does not re-render on
 * resize.
 */
export function useBreakpoint(): Breakpoint {
  return useSyncExternalStore(subscribeAll, currentBreakpoint, getServerSnapshot);
}

/**
 * Whether `breakpoint`'s condition currently matches the viewport.
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
