import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateProgressBarSources } from "./vanilla-extract.js";

type ProgressBarStatusFields = {
  indicatorBackgroundColor: TokenBinding<"color">;
  labelColor: TokenBinding<"color">;
};

type ProgressBarSizeFields = {
  height: TokenBinding<"dimension">;
  typography: TokenBinding<"typography">;
};

export type ProgressBarComponentOptions = {
  borderRadius: TokenBinding<"dimension">;
  trackBackgroundColor: TokenBinding<"color">;
  statuses: Record<string, ProgressBarStatusFields>;
  sizes: Record<string, ProgressBarSizeFields>;
  labelTypography: TokenBinding<"typography">;
  labelGap: TokenBinding<"dimension">;
  animationDuration: TokenBinding<"duration">;
};

export const progressBarComponent = defineRegistryComponent<ProgressBarComponentOptions>()({
  id: "progress-bar",
  name: "ProgressBar",
  internalDependencies: ["render-element"],
  schema: {
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the track and indicator.",
    },
    trackBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the track.",
    },
    statuses: {
      kind: "variants",
      description: "ProgressBar's own palette, consumer-defined keys, drives the status prop.",
      fields: {
        indicatorBackgroundColor: { kind: "token", type: "color" },
        labelColor: { kind: "token", type: "color" },
      },
    },
    sizes: {
      kind: "variants",
      description: "Consumer-defined sizes, drives the size prop.",
      fields: {
        height: { kind: "token", type: "dimension" },
        typography: { kind: "token", type: "typography" },
      },
    },
    labelTypography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to the label.",
    },
    labelGap: {
      kind: "token",
      type: "dimension",
      description: "Space between the label and the track.",
    },
    animationDuration: {
      kind: "token",
      type: "duration",
      description: "Duration of one indeterminate sweep.",
    },
  },
  output: vanillaExtractComponentOutput(
    "progress-bar",
    "ProgressBar",
    (_scales, _breakpoints, tokens) =>
      generateProgressBarSources({
        borderRadius: tokens.borderRadius!,
        trackBackgroundColor: tokens.trackBackgroundColor!,
        labelTypography: tokens.labelTypography!,
        labelGap: tokens.labelGap!,
        animationDuration: tokens.animationDuration!,
        tokens,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
