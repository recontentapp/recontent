import type { BreakpointBinding, InternalModuleDefinition } from "../../types.js";
import { generateResponsiveSource } from "./vanilla-extract.js";

export const responsiveModule: InternalModuleDefinition = {
  id: "responsive",
  outputs: {
    "vanilla-extract": {
      runtimeDependencies: {},
      generate: (breakpoints?: readonly BreakpointBinding[]) => {
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
  },
};
