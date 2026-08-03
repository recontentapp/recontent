import type { ScaleBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateStackSources } from "./vanilla-extract.js";

export type StackComponentOptions = {
  spacing: ScaleBinding<"dimension">;
};

export const stackComponent = defineRegistryComponent<StackComponentOptions>()({
  id: "stack",
  name: "Stack",
  internalDependencies: ["render-element"],
  schema: {
    spacing: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the Stack gap prop.",
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput("stack", "Stack", (scales) =>
      generateStackSources({ spacing: scales.spacing! }),
    ),
  },
});
