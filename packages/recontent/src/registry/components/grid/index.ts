import type { ScaleBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { componentArtifactPath } from "../../paths.js";
import { generateGridSources } from "./vanilla-extract.js";

export type GridComponentOptions = {
  spacing: ScaleBinding<"dimension">;
};

export const gridComponent = defineRegistryComponent<GridComponentOptions>()({
  id: "grid",
  name: "Grid",
  internalDependencies: ["render-element"],
  schema: {
    spacing: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the gap, columnGap and rowGap props.",
    },
  },
  outputs: {
    "vanilla-extract": {
      runtimeDependencies: { "@vanilla-extract/css": "^1.17.4", react: ">=18" },
      generate: ({ scales }) => {
        const sources = generateGridSources({ spacing: scales.spacing! });
        return [
          {
            filename: componentArtifactPath("grid", "Grid", ".gen.css.ts"),
            content: sources.styles,
          },
          {
            filename: componentArtifactPath("grid", "Grid", ".gen.tsx"),
            content: sources.component,
          },
        ];
      },
    },
  },
});
