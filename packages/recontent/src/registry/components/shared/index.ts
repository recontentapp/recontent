import { defineRegistryComponent } from "../../define.js";
import { componentArtifactPath } from "../../paths.js";
import { generateSharedSources } from "./vanilla-extract.js";

export type SharedComponentOptions = Record<string, never>;

export const sharedComponent = defineRegistryComponent<SharedComponentOptions>()({
  id: "shared",
  name: "Shared",
  schema: {},
  outputs: {
    "vanilla-extract": {
      runtimeDependencies: { react: ">=18" },
      generate: () => [
        {
          filename: componentArtifactPath("shared", "Shared", ".gen.tsx"),
          content: generateSharedSources(),
        },
      ],
    },
  },
});
