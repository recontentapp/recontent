import type { ScaleBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { componentArtifactPath } from "../../paths.js";
import { generateStackSources } from "./vanilla-extract.js";

export type StackComponentOptions = {
  spacing: ScaleBinding<"dimension">;
};

export const stackComponent = defineRegistryComponent<StackComponentOptions>()({
  id: "stack",
  name: "Stack",
  dependencies: ["shared"],
  schema: {
    spacing: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the Stack gap prop.",
    },
  },
  outputs: {
    "vanilla-extract": {
      runtimeDependencies: { "@vanilla-extract/css": "^1.17.4", react: ">=18" },
      generate: ({ scales }) => {
        const sources = generateStackSources({ spacing: scales.spacing! });
        return [
          {
            filename: componentArtifactPath("stack", "Stack", ".gen.css.ts"),
            content: sources.styles,
          },
          {
            filename: componentArtifactPath("stack", "Stack", ".gen.tsx"),
            content: sources.component,
          },
        ];
      },
    },
  },
});
