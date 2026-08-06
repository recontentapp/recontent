import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateOutlineSources } from "./vanilla-extract.js";

export type OutlineComponentOptions = {
  typography: TokenBinding<"typography">;
  color: TokenBinding<"color">;
  hoverColor: TokenBinding<"color">;
  activeColor: TokenBinding<"color">;
  activeTypography: TokenBinding<"typography">;
  border: TokenBinding<"border">;
  activeIndicatorColor: TokenBinding<"color">;
  indentSpacing: TokenBinding<"dimension">;
  itemHorizontalSpacing: TokenBinding<"dimension">;
  itemVerticalSpacing: TokenBinding<"dimension">;
};

export const outlineComponent = defineRegistryComponent<OutlineComponentOptions>()({
  id: "outline",
  name: "Outline",
  internalDependencies: ["render-element"],
  schema: {
    typography: { kind: "token", type: "typography", description: "Typography applied to items." },
    color: { kind: "token", type: "color", description: "Text color of an item." },
    hoverColor: { kind: "token", type: "color", description: "Text color of an item on hover." },
    activeColor: { kind: "token", type: "color", description: "Text color of the active item." },
    activeTypography: { kind: "token", type: "typography", description: "Typography of the active item." },
    border: { kind: "token", type: "border", description: "Border used for the vertical rail." },
    activeIndicatorColor: {
      kind: "token",
      type: "color",
      description: "Color of the indicator aligned with the active item.",
    },
    indentSpacing: { kind: "token", type: "dimension", description: "Indent applied per depth level." },
    itemHorizontalSpacing: { kind: "token", type: "dimension", description: "Left/right padding of an item." },
    itemVerticalSpacing: { kind: "token", type: "dimension", description: "Top/bottom padding of an item." },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "outline",
      "Outline",
      (_scales, _breakpoints, tokens) =>
        generateOutlineSources({
          typography: tokens.typography!,
          color: tokens.color!,
          hoverColor: tokens.hoverColor!,
          activeColor: tokens.activeColor!,
          activeTypography: tokens.activeTypography!,
          border: tokens.border!,
          activeIndicatorColor: tokens.activeIndicatorColor!,
          indentSpacing: tokens.indentSpacing!,
          itemHorizontalSpacing: tokens.itemHorizontalSpacing!,
          itemVerticalSpacing: tokens.itemVerticalSpacing!,
        }),
    ),
  },
});
