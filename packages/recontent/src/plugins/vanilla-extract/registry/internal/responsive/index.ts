import type { BreakpointBinding, InternalModuleDefinition } from "../../types.js";
import { generateResponsiveSource } from "./vanilla-extract.js";

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
