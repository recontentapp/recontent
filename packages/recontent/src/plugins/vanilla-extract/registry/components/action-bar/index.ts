import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateActionBarSources } from "./vanilla-extract.js";

export type ActionBarComponentOptions = {
  backgroundColor: TokenBinding<"color">;
  color: TokenBinding<"color">;
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
  shadow: TokenBinding<"shadow">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
  offset: TokenBinding<"dimension">;
};

export const actionBarComponent = defineRegistryComponent<ActionBarComponentOptions>()({
  id: "action-bar",
  name: "ActionBar",
  internalDependencies: ["render-element"],
  schema: {
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the action bar.",
    },
    color: {
      kind: "token",
      type: "color",
      description: "Text color of the action bar.",
    },
    border: {
      kind: "token",
      type: "border",
      description: "Border applied around the action bar.",
    },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the action bar.",
    },
    shadow: {
      kind: "token",
      type: "shadow",
      description: "Shadow applied to the action bar.",
    },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the action bar.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the action bar.",
    },
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between actions.",
    },
    offset: {
      kind: "token",
      type: "dimension",
      description: "Distance from the viewport edge.",
    },
  },
  output: vanillaExtractComponentOutput(
    "action-bar",
    "ActionBar",
    (_scales, _breakpoints, tokens) =>
      generateActionBarSources({
        backgroundColor: tokens.backgroundColor!,
        color: tokens.color!,
        border: tokens.border!,
        borderRadius: tokens.borderRadius!,
        shadow: tokens.shadow!,
        horizontalSpacing: tokens.horizontalSpacing!,
        verticalSpacing: tokens.verticalSpacing!,
        gap: tokens.gap!,
        offset: tokens.offset!,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
