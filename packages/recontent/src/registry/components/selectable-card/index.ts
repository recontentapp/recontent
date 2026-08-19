import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateSelectableCardSources } from "./vanilla-extract.js";

export type SelectableCardComponentOptions = {
  borderRadius: TokenBinding<"dimension">;
  border: TokenBinding<"border">;
  backgroundColor: TokenBinding<"color">;
  activeBackgroundColor: TokenBinding<"color">;
  activeBorderColor: TokenBinding<"color">;
  hoverBorderColor: TokenBinding<"color">;
  disabledBackgroundColor: TokenBinding<"color">;
  disabledColor: TokenBinding<"color">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
};

export const selectableCardComponent = defineRegistryComponent<SelectableCardComponentOptions>()({
  id: "selectable-card",
  name: "SelectableCard",
  internalDependencies: ["render-element"],
  schema: {
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the card.",
    },
    border: {
      kind: "token",
      type: "border",
      description: "Border applied around the card.",
    },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the card.",
    },
    activeBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the card when selected.",
    },
    activeBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the card when selected.",
    },
    hoverBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the card on hover.",
    },
    disabledBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the card when disabled.",
    },
    disabledColor: {
      kind: "token",
      type: "color",
      description: "Text color of the card when disabled.",
    },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the card.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the card.",
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "selectable-card",
      "SelectableCard",
      (_scales, _breakpoints, tokens, focusRingColor) =>
        generateSelectableCardSources({
          borderRadius: tokens.borderRadius!,
          border: tokens.border!,
          backgroundColor: tokens.backgroundColor!,
          activeBackgroundColor: tokens.activeBackgroundColor!,
          activeBorderColor: tokens.activeBorderColor!,
          hoverBorderColor: tokens.hoverBorderColor!,
          disabledBackgroundColor: tokens.disabledBackgroundColor!,
          disabledColor: tokens.disabledColor!,
          horizontalSpacing: tokens.horizontalSpacing!,
          verticalSpacing: tokens.verticalSpacing!,
          focusRingColor,
        }),
    ),
  },
});
