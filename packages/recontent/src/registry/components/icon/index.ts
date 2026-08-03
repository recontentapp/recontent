import type { ScaleBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateIconSources } from "./vanilla-extract.js";

export type IconComponentOptions = {
  size: ScaleBinding<"dimension">;
  color: ScaleBinding<"color">;
};

export const iconComponent = defineRegistryComponent<IconComponentOptions>()({
  id: "icon",
  name: "Icon",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    size: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the size prop.",
    },
    color: {
      kind: "scale",
      type: "color",
      description: "Scale used by the color prop.",
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput("icon", "Icon", (scales) =>
      generateIconSources({ size: scales.size!, color: scales.color! }),
    ),
  },
});
