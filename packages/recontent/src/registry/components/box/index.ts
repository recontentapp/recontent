import type { ScaleBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { componentArtifactPath } from "../../paths.js";
import { generateBoxSources } from "./vanilla-extract.js";

export type BoxComponentOptions = {
  spacing: ScaleBinding<"dimension">;
  surface: ScaleBinding<"color">;
  radius: ScaleBinding<"dimension">;
  border: ScaleBinding<"border">;
  boxShadow: ScaleBinding<"shadow">;
};

export const boxComponent = defineRegistryComponent<BoxComponentOptions>()({
  id: "box",
  name: "Box",
  dependencies: ["shared"],
  schema: {
    spacing: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by padding, margin and gap props.",
    },
    surface: {
      kind: "scale",
      type: "color",
      description: "Scale used by the backgroundColor prop.",
    },
    radius: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the borderRadius prop.",
    },
    border: {
      kind: "scale",
      type: "border",
      description: "Scale used by the border prop.",
    },
    boxShadow: {
      kind: "scale",
      type: "shadow",
      description: "Scale used by the boxShadow prop.",
    },
  },
  outputs: {
    "vanilla-extract": {
      runtimeDependencies: { "@vanilla-extract/css": "^1.17.4", react: ">=18" },
      generate: ({ scales }) => {
        const sources = generateBoxSources({
          spacing: scales.spacing!,
          surface: scales.surface!,
          radius: scales.radius!,
          border: scales.border!,
          boxShadow: scales.boxShadow!,
        });
        return [
          {
            filename: componentArtifactPath("box", "Box", ".gen.css.ts"),
            content: sources.styles,
          },
          {
            filename: componentArtifactPath("box", "Box", ".gen.tsx"),
            content: sources.component,
          },
        ];
      },
    },
  },
});
