import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateNumberInputSources } from "./vanilla-extract.js";

export type NumberInputComponentOptions = {
  // Input surface, shared with TextInput.
  borderRadius: TokenBinding<"dimension">;
  border: TokenBinding<"border">;
  backgroundColor: TokenBinding<"color">;
  color: TokenBinding<"color">;
  typography: TokenBinding<"typography">;
  placeholderColor: TokenBinding<"color">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
  hoverBorderColor: TokenBinding<"color">;
  focusBorderColor: TokenBinding<"color">;
  invalidBorderColor: TokenBinding<"color">;
  disabledBackgroundColor: TokenBinding<"color">;
  disabledColor: TokenBinding<"color">;
  readOnlyBackgroundColor: TokenBinding<"color">;
  iconColor: TokenBinding<"color">;
  iconSize: TokenBinding<"dimension">;
  affixColor: TokenBinding<"color">;
  affixBackgroundColor: TokenBinding<"color">;
  // NumberInput-specific.
  stepperBackgroundColor: TokenBinding<"color">;
  stepperColor: TokenBinding<"color">;
  stepperHoverBackgroundColor: TokenBinding<"color">;
  stepperBorder: TokenBinding<"border">;
  stepperWidth: TokenBinding<"dimension">;
};

/**
 * Icons aren't token bindings (Icon isn't a `ComponentContract` kind), so —
 * like TextInput's clear icon — these are build-time choices baked directly
 * into the generated component rather than `recontent.config.ts` bindings.
 */
const INCREMENT_ICON = "chevronDown";
const DECREMENT_ICON = "chevronDown";

export const numberInputComponent = defineRegistryComponent<NumberInputComponentOptions>()({
  id: "number-input",
  name: "NumberInput",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    borderRadius: { kind: "token", type: "dimension", description: "Corner radius of the input." },
    border: { kind: "token", type: "border", description: "Border applied around the input." },
    backgroundColor: { kind: "token", type: "color", description: "Background color of the input." },
    color: { kind: "token", type: "color", description: "Text color of the input." },
    typography: { kind: "token", type: "typography", description: "Typography applied to the input." },
    placeholderColor: { kind: "token", type: "color", description: "Text color of the placeholder." },
    horizontalSpacing: { kind: "token", type: "dimension", description: "Left/right padding of the input." },
    verticalSpacing: { kind: "token", type: "dimension", description: "Top/bottom padding of the input." },
    gap: { kind: "token", type: "dimension", description: "Space between affixes, icons and the field." },
    hoverBorderColor: { kind: "token", type: "color", description: "Border color of the input on hover." },
    focusBorderColor: { kind: "token", type: "color", description: "Border color of the input on focus." },
    invalidBorderColor: { kind: "token", type: "color", description: "Border color of the input when invalid." },
    disabledBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the input when disabled.",
    },
    disabledColor: { kind: "token", type: "color", description: "Text color of the input when disabled." },
    readOnlyBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the input when read-only.",
    },
    iconColor: { kind: "token", type: "color", description: "Color of the leading/trailing icons." },
    iconSize: { kind: "token", type: "dimension", description: "Size of the leading/trailing icons." },
    affixColor: { kind: "token", type: "color", description: "Text color of the prefix/suffix." },
    affixBackgroundColor: { kind: "token", type: "color", description: "Background color of the prefix/suffix." },
    stepperBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of a stepper button.",
    },
    stepperColor: { kind: "token", type: "color", description: "Icon color of a stepper button." },
    stepperHoverBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of a stepper button on hover.",
    },
    stepperBorder: { kind: "token", type: "border", description: "Border applied around the stepper group." },
    stepperWidth: { kind: "token", type: "dimension", description: "Width of a stepper button." },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "number-input",
      "NumberInput",
      (_scales, _breakpoints, tokens, focusRingColor) =>
        generateNumberInputSources({
          borderRadius: tokens.borderRadius!,
          border: tokens.border!,
          backgroundColor: tokens.backgroundColor!,
          color: tokens.color!,
          typography: tokens.typography!,
          placeholderColor: tokens.placeholderColor!,
          horizontalSpacing: tokens.horizontalSpacing!,
          verticalSpacing: tokens.verticalSpacing!,
          gap: tokens.gap!,
          hoverBorderColor: tokens.hoverBorderColor!,
          focusBorderColor: tokens.focusBorderColor!,
          focusRingColor,
          invalidBorderColor: tokens.invalidBorderColor!,
          disabledBackgroundColor: tokens.disabledBackgroundColor!,
          disabledColor: tokens.disabledColor!,
          readOnlyBackgroundColor: tokens.readOnlyBackgroundColor!,
          iconColor: tokens.iconColor!,
          iconSize: tokens.iconSize!,
          affixColor: tokens.affixColor!,
          affixBackgroundColor: tokens.affixBackgroundColor!,
          stepperBackgroundColor: tokens.stepperBackgroundColor!,
          stepperColor: tokens.stepperColor!,
          stepperHoverBackgroundColor: tokens.stepperHoverBackgroundColor!,
          stepperBorder: tokens.stepperBorder!,
          stepperWidth: tokens.stepperWidth!,
          incrementIcon: INCREMENT_ICON,
          decrementIcon: DECREMENT_ICON,
        }),
      { "@base-ui/react": "^1.0.0" },
    ),
  },
});
