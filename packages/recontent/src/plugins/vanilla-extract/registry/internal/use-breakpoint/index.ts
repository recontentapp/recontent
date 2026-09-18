import type { BreakpointBinding, InternalModuleDefinition } from "../../types.js";
import { generateUseBreakpointSource } from "./vanilla-extract.js";

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
