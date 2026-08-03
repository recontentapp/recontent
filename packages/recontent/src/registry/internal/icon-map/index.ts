import type { InternalModuleDefinition } from "../../types.js";
import { generateIconMapSource } from "./vanilla-extract.js";

export const iconMapModule: InternalModuleDefinition = {
  id: "icon-map",
  outputs: {
    "vanilla-extract": {
      runtimeDependencies: { react: ">=18" },
      generate: () => [
        {
          filename: "iconMap.tsx",
          content: generateIconMapSource(),
          writeMode: "once",
        },
      ],
    },
  },
};
