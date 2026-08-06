import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateAccordionSources } from "./vanilla-extract.js";

export type AccordionComponentOptions = {
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
  hoverBackgroundColor: TokenBinding<"color">;
  triggerHorizontalSpacing: TokenBinding<"dimension">;
  triggerVerticalSpacing: TokenBinding<"dimension">;
  triggerTypography: TokenBinding<"typography">;
  triggerColor: TokenBinding<"color">;
  contentHorizontalSpacing: TokenBinding<"dimension">;
  contentVerticalSpacing: TokenBinding<"dimension">;
  transitionDuration: TokenBinding<"duration">;
};

/**
 * The icon rendered by each item's trigger, rotated on open. Build-time
 * choice (not a token binding, so it isn't a `ComponentContract`) baked
 * directly into the generated component source.
 */
const INDICATOR_ICON = "chevronDown";

/**
 * Build-time toggle (not a token binding) between a full border wrapping the
 * whole accordion and a border-bottom-only look between items.
 */
const BORDER_BOTTOM_ONLY = false;

export const accordionComponent = defineRegistryComponent<AccordionComponentOptions>()({
  id: "accordion",
  name: "Accordion",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    border: {
      kind: "token",
      type: "border",
      description: "Border applied around the accordion (or between its items).",
    },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the accordion.",
    },
    hoverBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of a trigger on hover.",
    },
    triggerHorizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of each trigger.",
    },
    triggerVerticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of each trigger.",
    },
    triggerTypography: {
      kind: "token",
      type: "typography",
      description: "Typography used by each trigger.",
    },
    triggerColor: {
      kind: "token",
      type: "color",
      description: "Text color of each trigger.",
    },
    contentHorizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of each panel's content.",
    },
    contentVerticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of each panel's content.",
    },
    transitionDuration: {
      kind: "token",
      type: "duration",
      description: "Duration of each indicator's open/close rotation.",
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "accordion",
      "Accordion",
      (_scales, _breakpoints, tokens) =>
        generateAccordionSources({
          border: tokens.border!,
          borderRadius: tokens.borderRadius!,
          hoverBackgroundColor: tokens.hoverBackgroundColor!,
          triggerHorizontalSpacing: tokens.triggerHorizontalSpacing!,
          triggerVerticalSpacing: tokens.triggerVerticalSpacing!,
          triggerTypography: tokens.triggerTypography!,
          triggerColor: tokens.triggerColor!,
          contentHorizontalSpacing: tokens.contentHorizontalSpacing!,
          contentVerticalSpacing: tokens.contentVerticalSpacing!,
          transitionDuration: tokens.transitionDuration!,
          indicatorIcon: INDICATOR_ICON,
          borderBottomOnly: BORDER_BOTTOM_ONLY,
        }),
      { "@base-ui/react": "^1.0.0" },
    ),
  },
});
