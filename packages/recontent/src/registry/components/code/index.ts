import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateCodeSources } from "./vanilla-extract.js";

export type CodeComponentOptions = {
  color: TokenBinding<"color">;
  backgroundColor: TokenBinding<"color">;
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
  typography: TokenBinding<"typography">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
};

export const codeComponent = defineRegistryComponent<CodeComponentOptions>()({
  id: "code",
  name: "Code",
  internalDependencies: ["render-element"],
  schema: {
    color: {
      kind: "token",
      type: "color",
      description: "Text color for the code snippet.",
    },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color for the code snippet.",
    },
    border: {
      kind: "token",
      type: "border",
      description: "Border applied around the code snippet.",
    },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the code snippet.",
    },
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography used by the code font.",
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
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "code",
      "Code",
      (_scales, _breakpoints, tokens) =>
        generateCodeSources({
          color: tokens.color!,
          backgroundColor: tokens.backgroundColor!,
          border: tokens.border!,
          borderRadius: tokens.borderRadius!,
          typography: tokens.typography!,
          horizontalSpacing: tokens.horizontalSpacing!,
          verticalSpacing: tokens.verticalSpacing!,
        }),
    ),
  },
});
