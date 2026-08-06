import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateSliderSources } from "./vanilla-extract.js";

export type SliderComponentOptions = {
  trackBackgroundColor: TokenBinding<"color">;
  trackHeight: TokenBinding<"dimension">;
  borderRadius: TokenBinding<"dimension">;
  indicatorBackgroundColor: TokenBinding<"color">;
  thumbSize: TokenBinding<"dimension">;
  thumbBackgroundColor: TokenBinding<"color">;
  thumbBorder: TokenBinding<"border">;
  thumbShadow: TokenBinding<"shadow">;
  hoverThumbBackgroundColor: TokenBinding<"color">;
  focusRingColor: TokenBinding<"color">;
  disabledTrackBackgroundColor: TokenBinding<"color">;
  disabledThumbBackgroundColor: TokenBinding<"color">;
  markColor: TokenBinding<"color">;
  markTypography: TokenBinding<"typography">;
  valueLabelTypography: TokenBinding<"typography">;
  valueLabelColor: TokenBinding<"color">;
  valueLabelBackgroundColor: TokenBinding<"color">;
};

export const sliderComponent = defineRegistryComponent<SliderComponentOptions>()({
  id: "slider",
  name: "Slider",
  internalDependencies: ["render-element"],
  schema: {
    trackBackgroundColor: { kind: "token", type: "color", description: "Background color of the track." },
    trackHeight: { kind: "token", type: "dimension", description: "Thickness of the track." },
    borderRadius: { kind: "token", type: "dimension", description: "Corner radius of the track and indicator." },
    indicatorBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the filled portion of the track.",
    },
    thumbSize: { kind: "token", type: "dimension", description: "Diameter of the thumb." },
    thumbBackgroundColor: { kind: "token", type: "color", description: "Background color of the thumb." },
    thumbBorder: { kind: "token", type: "border", description: "Border applied around the thumb." },
    thumbShadow: { kind: "token", type: "shadow", description: "Shadow applied to the thumb." },
    hoverThumbBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the thumb on hover.",
    },
    focusRingColor: { kind: "token", type: "color", description: "Outline color shown on keyboard focus." },
    disabledTrackBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the track when disabled.",
    },
    disabledThumbBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the thumb when disabled.",
    },
    markColor: { kind: "token", type: "color", description: "Color of a step mark." },
    markTypography: { kind: "token", type: "typography", description: "Typography of a mark's label." },
    valueLabelTypography: { kind: "token", type: "typography", description: "Typography of the value label." },
    valueLabelColor: { kind: "token", type: "color", description: "Text color of the value label." },
    valueLabelBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the value label.",
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "slider",
      "Slider",
      (_scales, _breakpoints, tokens) =>
        generateSliderSources({
          trackBackgroundColor: tokens.trackBackgroundColor!,
          trackHeight: tokens.trackHeight!,
          borderRadius: tokens.borderRadius!,
          indicatorBackgroundColor: tokens.indicatorBackgroundColor!,
          thumbSize: tokens.thumbSize!,
          thumbBackgroundColor: tokens.thumbBackgroundColor!,
          thumbBorder: tokens.thumbBorder!,
          thumbShadow: tokens.thumbShadow!,
          hoverThumbBackgroundColor: tokens.hoverThumbBackgroundColor!,
          focusRingColor: tokens.focusRingColor!,
          disabledTrackBackgroundColor: tokens.disabledTrackBackgroundColor!,
          disabledThumbBackgroundColor: tokens.disabledThumbBackgroundColor!,
          markColor: tokens.markColor!,
          markTypography: tokens.markTypography!,
          valueLabelTypography: tokens.valueLabelTypography!,
          valueLabelColor: tokens.valueLabelColor!,
          valueLabelBackgroundColor: tokens.valueLabelBackgroundColor!,
        }),
      { "@base-ui/react": "^1.0.0" },
    ),
  },
});
