import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateTextInputSources } from "./vanilla-extract.js";

export type TextInputComponentOptions = {
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
};

/**
 * Icon isn't a token binding (Icon isn't a `ComponentContract` kind), so —
 * like other components' icon config — this is a build-time choice baked
 * directly into the generated component rather than a config binding.
 */
const CLEAR_ICON = "close";

export const textInputComponent = defineRegistryComponent<TextInputComponentOptions>()({
  id: "text-input",
  name: "TextInput",
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
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between affixes, icons and the field.",
    },
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
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "text-input",
      "TextInput",
      (_scales, _breakpoints, tokens, focusRingColor) =>
        generateTextInputSources({
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
          clearIcon: CLEAR_ICON,
        }),
    ),
  },
});
