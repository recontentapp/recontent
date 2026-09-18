import type { ScaleBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateGridSources } from "./vanilla-extract.js";

export type GridComponentOptions = {
  spacing: ScaleBinding<"dimension">;
};

export const gridComponent = defineRegistryComponent<GridComponentOptions>()({
  id: "grid",
  name: "Grid",
  internalDependencies: ["render-element", "responsive"],
  schema: {
    spacing: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the gap, columnGap and rowGap props.",
    },
  },
  output: vanillaExtractComponentOutput("grid", "Grid", (scales, breakpoints) =>
    generateGridSources({ spacing: scales.spacing! }, breakpoints),
  ),
});
