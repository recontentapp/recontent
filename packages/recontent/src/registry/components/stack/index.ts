import type { ScaleBinding, TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { componentArtifactPath } from "../../paths.js";
import { generateStackSources } from "./vanilla-extract.js";

export type StackComponentOptions = {
  backgroundColor: TokenBinding<"color">;
  gapScale: ScaleBinding<"dimension">;
};

export const stackComponent = defineRegistryComponent<StackComponentOptions>()({
  id: "stack",
  name: "Stack",
  schema: {
    backgroundColor: { kind: "token", type: "color" },
    gapScale: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the Stack gap prop.",
    },
  },
  outputs: {
    "vanilla-extract": {
      runtimeDependencies: { "@vanilla-extract/css": "^1.17.4", react: ">=18" },
      generate: ({ scales, tokens }) => {
        const sources = generateStackSources({
          gapScale: scales.gapScale!,
          backgroundColor: tokens.backgroundColor!,
        });
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
