import type { ScaleBinding, TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateSpinnerSources } from "./vanilla-extract.js";

export type SpinnerComponentOptions = {
  sizes: ScaleBinding<"dimension">;
  colors: ScaleBinding<"color">;
  trackColor: TokenBinding<"color">;
  thickness: TokenBinding<"dimension">;
  animationDuration: TokenBinding<"duration">;
};

export const spinnerComponent = defineRegistryComponent<SpinnerComponentOptions>()({
  id: "spinner",
  name: "Spinner",
  internalDependencies: ["render-element"],
  schema: {
    sizes: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the size prop.",
    },
    colors: {
      kind: "scale",
      type: "color",
      description: "Scale used by the color prop.",
    },
    trackColor: {
      kind: "token",
      type: "color",
      description: "Color of the spinner's static track.",
    },
    thickness: {
      kind: "token",
      type: "dimension",
      description: "Stroke width of the spinner.",
    },
    animationDuration: {
      kind: "token",
      type: "duration",
      description: "Duration of one full rotation.",
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "spinner",
      "Spinner",
      (scales, _breakpoints, tokens) =>
        generateSpinnerSources({
          sizes: scales.sizes!,
          colors: scales.colors!,
          trackColor: tokens.trackColor!,
          thickness: tokens.thickness!,
          animationDuration: tokens.animationDuration!,
        }),
    ),
  },
});
