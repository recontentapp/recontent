import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateTextareaSources } from "./vanilla-extract.js";

export type TextareaComponentOptions = {
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
  // Textarea-specific.
  counterTypography: TokenBinding<"typography">;
  counterColor: TokenBinding<"color">;
  counterExceededColor: TokenBinding<"color">;
  counterGap: TokenBinding<"dimension">;
  resizeHandleColor: TokenBinding<"color">;
};

export const textareaComponent = defineRegistryComponent<TextareaComponentOptions>()({
  id: "textarea",
  name: "Textarea",
  internalDependencies: ["render-element"],
  schema: {
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius of the textarea.",
    },
    border: { kind: "token", type: "border", description: "Border applied around the textarea." },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the textarea.",
    },
    color: { kind: "token", type: "color", description: "Text color of the textarea." },
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to the textarea.",
    },
    placeholderColor: {
      kind: "token",
      type: "color",
      description: "Text color of the placeholder.",
    },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the textarea.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the textarea.",
    },
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between the field and its counter.",
    },
    hoverBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the textarea on hover.",
    },
    focusBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the textarea on focus.",
    },
    invalidBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the textarea when invalid.",
    },
    disabledBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the textarea when disabled.",
    },
    disabledColor: {
      kind: "token",
      type: "color",
      description: "Text color of the textarea when disabled.",
    },
    readOnlyBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the textarea when read-only.",
    },
    iconColor: {
      kind: "token",
      type: "color",
      description: "Color of the leading/trailing icons.",
    },
    iconSize: {
      kind: "token",
      type: "dimension",
      description: "Size of the leading/trailing icons.",
    },
    affixColor: { kind: "token", type: "color", description: "Text color of the prefix/suffix." },
    affixBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the prefix/suffix.",
    },
    counterTypography: {
      kind: "token",
      type: "typography",
      description: "Typography of the character counter.",
    },
    counterColor: {
      kind: "token",
      type: "color",
      description: "Text color of the character counter.",
    },
    counterExceededColor: {
      kind: "token",
      type: "color",
      description: "Text color of the counter once maxLength is exceeded.",
    },
    counterGap: {
      kind: "token",
      type: "dimension",
      description: "Space above the character counter.",
    },
    resizeHandleColor: { kind: "token", type: "color", description: "Color of the resize handle." },
  },
  output: vanillaExtractComponentOutput(
    "textarea",
    "Textarea",
    (_scales, _breakpoints, tokens, focusRingColor) =>
      generateTextareaSources({
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
        counterTypography: tokens.counterTypography!,
        counterColor: tokens.counterColor!,
        counterExceededColor: tokens.counterExceededColor!,
        counterGap: tokens.counterGap!,
        resizeHandleColor: tokens.resizeHandleColor!,
      }),
  ),
});
