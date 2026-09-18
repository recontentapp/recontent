import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateToggleSources } from "./vanilla-extract.js";

type ToggleSizeFields = {
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  typography: TokenBinding<"typography">;
};

export type ToggleComponentOptions = {
  borderRadius: TokenBinding<"dimension">;
  optionBorderRadius: TokenBinding<"dimension">;
  border: TokenBinding<"border">;
  backgroundColor: TokenBinding<"color">;
  color: TokenBinding<"color">;
  typography: TokenBinding<"typography">;
  hoverColor: TokenBinding<"color">;
  activeColor: TokenBinding<"color">;
  activeBackgroundColor: TokenBinding<"color">;
  disabledColor: TokenBinding<"color">;
  sizes: Record<string, ToggleSizeFields>;
};

export const toggleComponent = defineRegistryComponent<ToggleComponentOptions>()({
  id: "toggle",
  name: "Toggle",
  internalDependencies: ["render-element"],
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
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the outer track.",
    },
    color: {
      kind: "token",
      type: "color",
      description: "Text color of an unselected option.",
    },
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to option labels.",
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
    sizes: {
      kind: "variants",
      description: "Consumer-defined sizes, drives the size prop.",
      fields: {
        horizontalSpacing: { kind: "token", type: "dimension" },
        verticalSpacing: { kind: "token", type: "dimension" },
        typography: { kind: "token", type: "typography" },
      },
    },
  },
  output: vanillaExtractComponentOutput(
    "toggle",
    "Toggle",
    (_scales, _breakpoints, tokens, focusRingColor) =>
      generateToggleSources({
        borderRadius: tokens.borderRadius!,
        optionBorderRadius: tokens.optionBorderRadius!,
        border: tokens.border!,
        backgroundColor: tokens.backgroundColor!,
        color: tokens.color!,
        typography: tokens.typography!,
        hoverColor: tokens.hoverColor!,
        activeColor: tokens.activeColor!,
        activeBackgroundColor: tokens.activeBackgroundColor!,
        disabledColor: tokens.disabledColor!,
        tokens,
        focusRingColor,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
