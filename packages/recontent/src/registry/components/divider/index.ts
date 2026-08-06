import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateDividerSources } from "./vanilla-extract.js";

export type DividerComponentOptions = {
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
  color: TokenBinding<"color">;
  spacing: TokenBinding<"dimension">;
};

export const dividerComponent = defineRegistryComponent<DividerComponentOptions>()({
  id: "divider",
  name: "Divider",
  internalDependencies: ["render-element"],
  schema: {
    border: {
      kind: "token",
      type: "border",
      description: "Border applied along the divider's rule.",
    },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the divider.",
    },
    color: {
      kind: "token",
      type: "color",
      description: "Color of the divider's rule, overriding the border's own color.",
    },
    spacing: {
      kind: "token",
      type: "dimension",
      description: "Margin applied along the divider's cross axis.",
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "divider",
      "Divider",
      (_scales, _breakpoints, tokens) =>
        generateDividerSources({
          border: tokens.border!,
          borderRadius: tokens.borderRadius!,
          color: tokens.color!,
          spacing: tokens.spacing!,
        }),
      { "@base-ui/react": "^1.0.0" },
    ),
  },
});
