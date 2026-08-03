import type { ScaleBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateStackItemSources } from "./vanilla-extract.js";

export type StackItemComponentOptions = {
  spacing: ScaleBinding<"dimension">;
};

export const stackItemComponent = defineRegistryComponent<StackItemComponentOptions>()({
  id: "stack-item",
  name: "StackItem",
  internalDependencies: ["render-element"],
  schema: {
    spacing: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the StackItem basis prop.",
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput("stack-item", "StackItem", (scales) =>
      generateStackItemSources({ spacing: scales.spacing! }),
    ),
  },
});
