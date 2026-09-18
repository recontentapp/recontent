import type { ScaleBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateTextSources } from "./vanilla-extract.js";

export type TextComponentOptions = {
  typography: ScaleBinding<"typography">;
  color: ScaleBinding<"color">;
};

export const textComponent = defineRegistryComponent<TextComponentOptions>()({
  id: "text",
  name: "Text",
  internalDependencies: ["render-element", "responsive"],
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
  output: vanillaExtractComponentOutput("text", "Text", (scales, breakpoints) =>
    generateTextSources(
      {
        typography: scales.typography!,
        color: scales.color!,
      },
      breakpoints,
    ),
  ),
});
