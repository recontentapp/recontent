import type { ScaleBinding, TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateRadioListSources } from "./vanilla-extract.js";

export type RadioListComponentOptions = {
  sizes: ScaleBinding<"dimension">;
  border: TokenBinding<"border">;
  backgroundColor: TokenBinding<"color">;
  checkedBorderColor: TokenBinding<"color">;
  checkedColor: TokenBinding<"color">;
  hoverBorderColor: TokenBinding<"color">;
  focusRingColor: TokenBinding<"color">;
  invalidBorderColor: TokenBinding<"color">;
  disabledBackgroundColor: TokenBinding<"color">;
  disabledColor: TokenBinding<"color">;
  labelTypography: TokenBinding<"typography">;
  labelColor: TokenBinding<"color">;
  descriptionTypography: TokenBinding<"typography">;
  descriptionColor: TokenBinding<"color">;
  gap: TokenBinding<"dimension">;
  optionGap: TokenBinding<"dimension">;
};

export const radioListComponent = defineRegistryComponent<RadioListComponentOptions>()({
  id: "radio-list",
  name: "RadioList",
  internalDependencies: ["render-element"],
  schema: {
    sizes: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the size prop.",
    },
    border: {
      kind: "token",
      type: "border",
      description: "Border applied around each radio control.",
    },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of a radio control.",
    },
    checkedBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of a checked radio control.",
    },
    checkedColor: {
      kind: "token",
      type: "color",
      description: "Color of the inner dot.",
    },
    hoverBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of a radio control on hover.",
    },
    focusRingColor: {
      kind: "token",
      type: "color",
      description: "Outline color shown on keyboard focus.",
    },
    invalidBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of a radio control when invalid.",
    },
    disabledBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of a radio control when disabled.",
    },
    disabledColor: {
      kind: "token",
      type: "color",
      description: "Color of the inner dot when disabled.",
    },
    labelTypography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to an option's label.",
    },
    labelColor: {
      kind: "token",
      type: "color",
      description: "Text color of an option's label.",
    },
    descriptionTypography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to an option's description.",
    },
    descriptionColor: {
      kind: "token",
      type: "color",
      description: "Text color of an option's description.",
    },
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between a control and its label.",
    },
    optionGap: {
      kind: "token",
      type: "dimension",
      description: "Space between options.",
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "radio-list",
      "RadioList",
      (scales, _breakpoints, tokens) =>
        generateRadioListSources({
          sizes: scales.sizes!,
          border: tokens.border!,
          backgroundColor: tokens.backgroundColor!,
          checkedBorderColor: tokens.checkedBorderColor!,
          checkedColor: tokens.checkedColor!,
          hoverBorderColor: tokens.hoverBorderColor!,
          focusRingColor: tokens.focusRingColor!,
          invalidBorderColor: tokens.invalidBorderColor!,
          disabledBackgroundColor: tokens.disabledBackgroundColor!,
          disabledColor: tokens.disabledColor!,
          labelTypography: tokens.labelTypography!,
          labelColor: tokens.labelColor!,
          descriptionTypography: tokens.descriptionTypography!,
          descriptionColor: tokens.descriptionColor!,
          gap: tokens.gap!,
          optionGap: tokens.optionGap!,
        }),
      { "@base-ui/react": "^1.0.0" },
    ),
  },
});
