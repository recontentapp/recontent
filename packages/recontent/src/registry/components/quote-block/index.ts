import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateQuoteBlockSources } from "./vanilla-extract.js";

export type QuoteBlockComponentOptions = {
  color: TokenBinding<"color">;
  typography: TokenBinding<"typography">;
  citationColor: TokenBinding<"color">;
  citationTypography: TokenBinding<"typography">;
  border: TokenBinding<"border">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
};

export const quoteBlockComponent = defineRegistryComponent<QuoteBlockComponentOptions>()({
  id: "quote-block",
  name: "QuoteBlock",
  internalDependencies: ["render-element"],
  schema: {
    color: {
      kind: "token",
      type: "color",
      description: "Text color for the quote.",
    },
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography used by the quote.",
    },
    citationColor: {
      kind: "token",
      type: "color",
      description: "Text color for the citation.",
    },
    citationTypography: {
      kind: "token",
      type: "typography",
      description: "Typography used by the citation.",
    },
    border: {
      kind: "token",
      type: "border",
      description: "Leading rule shown along the quote's left edge.",
    },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding.",
    },
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between the quote and its citation.",
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "quote-block",
      "QuoteBlock",
      (_scales, _breakpoints, tokens) =>
        generateQuoteBlockSources({
          color: tokens.color!,
          typography: tokens.typography!,
          citationColor: tokens.citationColor!,
          citationTypography: tokens.citationTypography!,
          border: tokens.border!,
          horizontalSpacing: tokens.horizontalSpacing!,
          verticalSpacing: tokens.verticalSpacing!,
          gap: tokens.gap!,
        }),
    ),
  },
});
