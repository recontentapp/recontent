import type { ScaleBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { componentArtifactPath } from "../../paths.js";
import { generateStackItemSources } from "./vanilla-extract.js";

export type StackItemComponentOptions = {
  spacing: ScaleBinding<"dimension">;
};

export const stackItemComponent = defineRegistryComponent<StackItemComponentOptions>()({
  id: "stack-item",
  name: "StackItem",
  dependencies: ["shared"],
  schema: {
    spacing: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the StackItem basis prop.",
    },
  },
  outputs: {
    "vanilla-extract": {
      runtimeDependencies: { "@vanilla-extract/css": "^1.17.4", react: ">=18" },
      generate: ({ scales }) => {
        const sources = generateStackItemSources({ spacing: scales.spacing! });
        return [
          {
            filename: componentArtifactPath("stack-item", "StackItem", ".gen.css.ts"),
            content: sources.styles,
          },
          {
            filename: componentArtifactPath("stack-item", "StackItem", ".gen.tsx"),
            content: sources.component,
          },
        ];
      },
    },
  },
});
