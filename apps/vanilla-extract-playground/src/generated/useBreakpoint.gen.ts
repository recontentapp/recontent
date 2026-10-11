import { useSyncExternalStore } from "react";

export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

const QUERIES: Partial<Record<Breakpoint, string>> = {
  "sm": "screen and (min-width: 576px)",
  "md": "screen and (min-width: 768px)",
  "lg": "screen and (min-width: 992px)",
  "xl": "screen and (min-width: 1200px)",
  "xxl": "screen and (min-width: 1800px)",
};

const ORDER = ["xs", "sm", "md", "lg", "xl", "xxl"] as const;

const mediaQueryLists = new Map<string, MediaQueryList>();

function mediaQuery(query: string): MediaQueryList {
  let mql = mediaQueryLists.get(query);
  if (!mql) {
    mql = matchMedia(query);
    mediaQueryLists.set(query, mql);
  }
  return mql;
}

function subscribeAll(onChange: () => void): () => void {
  const queries = Object.values(QUERIES).map(mediaQuery);
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
  let current: Breakpoint = "xs";
  for (const breakpoint of ORDER) {
    const query = QUERIES[breakpoint];
    if (query && mediaQuery(query).matches) {
      current = breakpoint;
    }
  }
  return current;
}

function getServerSnapshot(): Breakpoint {
  return "xs";
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
      const mql = mediaQuery(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => (query ? mediaQuery(query).matches : true),
    () => !query,
  );
}
