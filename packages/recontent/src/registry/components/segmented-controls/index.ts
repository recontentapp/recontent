import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateSegmentedControlsSources } from "./vanilla-extract.js";

export type SegmentedControlsComponentOptions = {
  borderRadius: TokenBinding<"dimension">;
  optionBorderRadius: TokenBinding<"dimension">;
  border: TokenBinding<"border">;
  borderColor: TokenBinding<"color">;
  typography: TokenBinding<"typography">;
  color: TokenBinding<"color">;
  backgroundColor: TokenBinding<"color">;
  hoverColor: TokenBinding<"color">;
  activeColor: TokenBinding<"color">;
  activeBackgroundColor: TokenBinding<"color">;
  disabledColor: TokenBinding<"color">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  optionHorizontalSpacing: TokenBinding<"dimension">;
  optionVerticalSpacing: TokenBinding<"dimension">;
  optionGap: TokenBinding<"dimension">;
  iconSize: TokenBinding<"dimension">;
};

export const segmentedControlsComponent = defineRegistryComponent<SegmentedControlsComponentOptions>()({
  id: "segmented-controls",
  name: "SegmentedControls",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius of the outer track.",
    },
    optionBorderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius of each option.",
    },
    border: {
      kind: "token",
      type: "border",
      description: "Border applied around the outer track.",
    },
    borderColor: {
      kind: "token",
      type: "color",
      description: "Color of the outer track's border, overriding the border's own color.",
    },
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to option labels.",
    },
    color: {
      kind: "token",
      type: "color",
      description: "Text color of an unselected option.",
    },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the outer track.",
    },
    hoverColor: {
      kind: "token",
      type: "color",
      description: "Text color of an unselected option on hover.",
    },
    activeColor: {
      kind: "token",
      type: "color",
      description: "Text color of the selected option.",
    },
    activeBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the selected option.",
    },
    disabledColor: {
      kind: "token",
      type: "color",
      description: "Text color of a disabled option.",
    },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the outer track.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the outer track.",
    },
    optionHorizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of each option.",
    },
    optionVerticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of each option.",
    },
    optionGap: {
      kind: "token",
      type: "dimension",
      description: "Space between an option's icon and label.",
    },
    iconSize: {
      kind: "token",
      type: "dimension",
      description: "Size of an option's icon.",
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "segmented-controls",
      "SegmentedControls",
      (_scales, _breakpoints, tokens) =>
        generateSegmentedControlsSources({
          borderRadius: tokens.borderRadius!,
          optionBorderRadius: tokens.optionBorderRadius!,
          border: tokens.border!,
          borderColor: tokens.borderColor!,
          typography: tokens.typography!,
          color: tokens.color!,
          backgroundColor: tokens.backgroundColor!,
          hoverColor: tokens.hoverColor!,
          activeColor: tokens.activeColor!,
          activeBackgroundColor: tokens.activeBackgroundColor!,
          disabledColor: tokens.disabledColor!,
          horizontalSpacing: tokens.horizontalSpacing!,
          verticalSpacing: tokens.verticalSpacing!,
          optionHorizontalSpacing: tokens.optionHorizontalSpacing!,
          optionVerticalSpacing: tokens.optionVerticalSpacing!,
          optionGap: tokens.optionGap!,
          iconSize: tokens.iconSize!,
        }),
      { "@base-ui/react": "^1.0.0" },
    ),
  },
});
