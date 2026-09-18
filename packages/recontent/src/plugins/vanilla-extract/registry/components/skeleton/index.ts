import type { ScaleBinding, TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateSkeletonSources } from "./vanilla-extract.js";

export type SkeletonComponentOptions = {
  backgroundColor: TokenBinding<"color">;
  highlightColor: TokenBinding<"color">;
  radii: ScaleBinding<"dimension">;
  circularRadius: TokenBinding<"dimension">;
  lineGap: TokenBinding<"dimension">;
  animationDuration: TokenBinding<"duration">;
};

export const skeletonComponent = defineRegistryComponent<SkeletonComponentOptions>()({
  id: "skeleton",
  name: "Skeleton",
  internalDependencies: ["render-element"],
  schema: {
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Base color of the skeleton.",
    },
    highlightColor: {
      kind: "token",
      type: "color",
      description: "Color of the shimmer sweep.",
    },
    radii: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the radius prop.",
    },
    circularRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the circular variant.",
    },
    lineGap: {
      kind: "token",
      type: "dimension",
      description: "Space between multiple text lines.",
    },
    animationDuration: {
      kind: "token",
      type: "duration",
      description: "Duration of one shimmer sweep.",
    },
  },
  output: vanillaExtractComponentOutput("skeleton", "Skeleton", (scales, _breakpoints, tokens) =>
    generateSkeletonSources({
      backgroundColor: tokens.backgroundColor!,
      highlightColor: tokens.highlightColor!,
      radii: scales.radii!,
      circularRadius: tokens.circularRadius!,
      lineGap: tokens.lineGap!,
      animationDuration: tokens.animationDuration!,
    }),
  ),
});
