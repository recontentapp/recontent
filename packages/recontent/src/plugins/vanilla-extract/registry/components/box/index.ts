import type { ScaleBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
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
  internalDependencies: ["render-element", "responsive"],
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
  output: vanillaExtractComponentOutput("box", "Box", (scales, breakpoints) =>
    generateBoxSources(
      {
        spacing: scales.spacing!,
        surface: scales.surface!,
        radius: scales.radius!,
        border: scales.border!,
        boxShadow: scales.boxShadow!,
      },
      breakpoints,
    ),
  ),
});
