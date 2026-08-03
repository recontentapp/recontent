import type { ScaleBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { componentArtifactPath } from "../../paths.js";
import { generateTextSources } from "./vanilla-extract.js";

export type TextComponentOptions = {
  typography: ScaleBinding<"typography">;
  color: ScaleBinding<"color">;
};

export const textComponent = defineRegistryComponent<TextComponentOptions>()({
  id: "text",
  name: "Text",
  internalDependencies: ["render-element"],
  schema: {
    typography: {
      kind: "scale",
      type: "typography",
      description: "Scale used by the variant prop.",
    },
    color: {
      kind: "scale",
      type: "color",
      description: "Scale used by the color prop.",
    },
  },
  outputs: {
    "vanilla-extract": {
      runtimeDependencies: { "@vanilla-extract/css": "^1.17.4", react: ">=18" },
      generate: ({ scales }) => {
        const sources = generateTextSources({
          typography: scales.typography!,
          color: scales.color!,
        });
        return [
          {
            filename: componentArtifactPath("text", "Text", ".gen.css.ts"),
            content: sources.styles,
          },
          {
            filename: componentArtifactPath("text", "Text", ".gen.tsx"),
            content: sources.component,
          },
        ];
      },
    },
  },
});
