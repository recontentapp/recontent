import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateCollapsibleSources } from "./vanilla-extract.js";

export type CollapsibleComponentOptions = {
  borderRadius: TokenBinding<"dimension">;
  border: TokenBinding<"border">;
  backgroundColor: TokenBinding<"color">;
  hoverBackgroundColor: TokenBinding<"color">;
  triggerHorizontalSpacing: TokenBinding<"dimension">;
  triggerVerticalSpacing: TokenBinding<"dimension">;
  triggerTypography: TokenBinding<"typography">;
  triggerColor: TokenBinding<"color">;
  contentHorizontalSpacing: TokenBinding<"dimension">;
  contentVerticalSpacing: TokenBinding<"dimension">;
  transition: TokenBinding<"transition">;
};

/**
 * The icon rendered by the trigger, rotated on open. This is a build-time
 * choice (not a token binding, so it isn't a `ComponentContract`) baked
 * directly into the generated component source.
 */
const INDICATOR_ICON = "chevronDown";

export const collapsibleComponent = defineRegistryComponent<CollapsibleComponentOptions>()({
  id: "collapsible",
  name: "Collapsible",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the collapsible.",
    },
    border: {
      kind: "token",
      type: "border",
      description: "Border applied around the collapsible.",
    },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the collapsible.",
    },
    hoverBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the trigger on hover.",
    },
    triggerHorizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the trigger.",
    },
    triggerVerticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the trigger.",
    },
    triggerTypography: {
      kind: "token",
      type: "typography",
      description: "Typography used by the trigger.",
    },
    triggerColor: {
      kind: "token",
      type: "color",
      description: "Text color of the trigger.",
    },
    contentHorizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the panel content.",
    },
    contentVerticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the panel content.",
    },
    transition: {
      kind: "token",
      type: "transition",
      description: "Transition of the indicator's open/close rotation.",
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "collapsible",
      "Collapsible",
      (_scales, _breakpoints, tokens, focusRingColor) =>
        generateCollapsibleSources({
          borderRadius: tokens.borderRadius!,
          border: tokens.border!,
          backgroundColor: tokens.backgroundColor!,
          hoverBackgroundColor: tokens.hoverBackgroundColor!,
          triggerHorizontalSpacing: tokens.triggerHorizontalSpacing!,
          triggerVerticalSpacing: tokens.triggerVerticalSpacing!,
          triggerTypography: tokens.triggerTypography!,
          triggerColor: tokens.triggerColor!,
          contentHorizontalSpacing: tokens.contentHorizontalSpacing!,
          contentVerticalSpacing: tokens.contentVerticalSpacing!,
          transition: tokens.transition!,
          indicatorIcon: INDICATOR_ICON,
          focusRingColor,
        }),
      { "@base-ui/react": "^1.0.0" },
    ),
  },
});
