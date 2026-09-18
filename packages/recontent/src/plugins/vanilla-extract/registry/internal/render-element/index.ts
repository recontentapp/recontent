import type { InternalModuleDefinition } from "../../types.js";
import { generateRenderElementSource } from "./vanilla-extract.js";

export const renderElementModule: InternalModuleDefinition = {
  id: "render-element",
  output: {
    runtimeDependencies: { react: ">=18" },
    generate: () => [
      {
        filename: "renderElement.gen.tsx",
        content: generateRenderElementSource(),
      },
    ],
  },
};
