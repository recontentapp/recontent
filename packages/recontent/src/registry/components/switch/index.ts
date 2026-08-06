import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateSwitchSources } from "./vanilla-extract.js";

type SwitchSizeFields = {
  trackWidth: TokenBinding<"dimension">;
  trackHeight: TokenBinding<"dimension">;
  thumbSize: TokenBinding<"dimension">;
};

export type SwitchComponentOptions = {
  sizes: Record<string, SwitchSizeFields>;
  borderRadius: TokenBinding<"dimension">;
  trackBackgroundColor: TokenBinding<"color">;
  trackCheckedBackgroundColor: TokenBinding<"color">;
  trackBorder: TokenBinding<"border">;
  thumbBackgroundColor: TokenBinding<"color">;
  thumbShadow: TokenBinding<"shadow">;
  focusRingColor: TokenBinding<"color">;
  disabledTrackBackgroundColor: TokenBinding<"color">;
  labelTypography: TokenBinding<"typography">;
  labelColor: TokenBinding<"color">;
  gap: TokenBinding<"dimension">;
  transitionDuration: TokenBinding<"duration">;
};

export const switchComponent = defineRegistryComponent<SwitchComponentOptions>()({
  id: "switch",
  name: "Switch",
  internalDependencies: ["render-element"],
  schema: {
    sizes: {
      kind: "variants",
      description: "Consumer-defined sizes, drives the size prop.",
      fields: {
        trackWidth: { kind: "token", type: "dimension" },
        trackHeight: { kind: "token", type: "dimension" },
        thumbSize: { kind: "token", type: "dimension" },
      },
    },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the track and thumb.",
    },
    trackBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the track when off.",
    },
    trackCheckedBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the track when on.",
    },
    trackBorder: {
      kind: "token",
      type: "border",
      description: "Border applied around the track.",
    },
    thumbBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the thumb.",
    },
    thumbShadow: {
      kind: "token",
      type: "shadow",
      description: "Shadow applied to the thumb.",
    },
    focusRingColor: {
      kind: "token",
      type: "color",
      description: "Outline color shown on keyboard focus.",
    },
    disabledTrackBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the track when disabled.",
    },
    labelTypography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to the label.",
    },
    labelColor: {
      kind: "token",
      type: "color",
      description: "Text color of the label.",
    },
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between the track and the label.",
    },
    transitionDuration: {
      kind: "token",
      type: "duration",
      description: "Duration of the thumb's slide transition.",
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "switch",
      "Switch",
      (_scales, _breakpoints, tokens) =>
        generateSwitchSources({
          borderRadius: tokens.borderRadius!,
          trackBackgroundColor: tokens.trackBackgroundColor!,
          trackCheckedBackgroundColor: tokens.trackCheckedBackgroundColor!,
          trackBorder: tokens.trackBorder!,
          thumbBackgroundColor: tokens.thumbBackgroundColor!,
          thumbShadow: tokens.thumbShadow!,
          focusRingColor: tokens.focusRingColor!,
          disabledTrackBackgroundColor: tokens.disabledTrackBackgroundColor!,
          labelTypography: tokens.labelTypography!,
          labelColor: tokens.labelColor!,
          gap: tokens.gap!,
          transitionDuration: tokens.transitionDuration!,
          tokens,
        }),
      { "@base-ui/react": "^1.0.0" },
    ),
  },
});
