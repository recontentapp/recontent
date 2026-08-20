import type { InternalModuleDefinition } from "../../types.js";
import { generateIconMapSource } from "./vanilla-extract.js";

export const iconMapModule: InternalModuleDefinition = {
  id: "icon-map",
  outputs: {
    "vanilla-extract": {
      runtimeDependencies: { react: ">=18" },
      generate: (options?: { iconNames?: readonly string[] }) => [
        {
          filename: "iconMap.tsx",
          content: generateIconMapSource(options?.iconNames ?? []),
          writeMode: "once",
        },
      ],
    },
  },
};
