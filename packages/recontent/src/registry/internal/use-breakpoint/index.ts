import type { BreakpointBinding, InternalModuleDefinition } from "../../types.js";
import { generateUseBreakpointSource } from "./vanilla-extract.js";

export const useBreakpointModule: InternalModuleDefinition = {
  id: "use-breakpoint",
  outputs: {
    "vanilla-extract": {
      runtimeDependencies: { react: ">=18" },
      generate: (breakpoints?: readonly BreakpointBinding[]) => {
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
  },
};
