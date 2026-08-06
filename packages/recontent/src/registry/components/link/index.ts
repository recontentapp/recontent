import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateLinkSources } from "./vanilla-extract.js";

export type LinkComponentOptions = {
  color: TokenBinding<"color">;
  hoverColor: TokenBinding<"color">;
  typography: TokenBinding<"typography">;
  visitedColor: TokenBinding<"color">;
};

export const linkComponent = defineRegistryComponent<LinkComponentOptions>()({
  id: "link",
  name: "Link",
  internalDependencies: ["render-element"],
  schema: {
    color: {
      kind: "token",
      type: "color",
      description: "Text color of the link.",
    },
    hoverColor: {
      kind: "token",
      type: "color",
      description: "Text color of the link on hover.",
    },
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to the link's text.",
    },
    visitedColor: {
      kind: "token",
      type: "color",
      description: "Text color of the link once visited.",
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "link",
      "Link",
      (_scales, _breakpoints, tokens) =>
        generateLinkSources({
          color: tokens.color!,
          hoverColor: tokens.hoverColor!,
          typography: tokens.typography!,
          visitedColor: tokens.visitedColor!,
        }),
    ),
  },
});
