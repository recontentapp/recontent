import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateTooltipSources } from "./vanilla-extract.js";

export type TooltipComponentOptions = {
  backgroundColor: TokenBinding<"color">;
  color: TokenBinding<"color">;
  typography: TokenBinding<"typography">;
  borderRadius: TokenBinding<"dimension">;
  border: TokenBinding<"border">;
  shadow: TokenBinding<"shadow">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  offset: TokenBinding<"dimension">;
  maxWidth: TokenBinding<"dimension">;
  arrowSize: TokenBinding<"dimension">;
  transition: TokenBinding<"transition">;
};

/**
 * `arrow` is a plain build-time "Option" switch — not a token binding, so it
 * isn't a `ComponentContract` kind either (only "token" | "scale" |
 * "variants" are). Like Collapsible's indicator icon, it's a build-time
 * choice baked directly into the generated component.
 */
const SHOW_ARROW = true;

export const tooltipComponent = defineRegistryComponent<TooltipComponentOptions>()({
  id: "tooltip",
  name: "Tooltip",
  internalDependencies: ["render-element"],
  schema: {
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the tooltip.",
    },
    color: { kind: "token", type: "color", description: "Text color of the tooltip." },
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to the tooltip.",
    },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the tooltip.",
    },
    border: { kind: "token", type: "border", description: "Border applied around the tooltip." },
    shadow: { kind: "token", type: "shadow", description: "Shadow applied to the tooltip." },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the tooltip.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the tooltip.",
    },
    offset: {
      kind: "token",
      type: "dimension",
      description: "Gap between the trigger and the tooltip.",
    },
    maxWidth: { kind: "token", type: "dimension", description: "Maximum width of the tooltip." },
    arrowSize: { kind: "token", type: "dimension", description: "Size of the arrow." },
    transition: {
      kind: "token",
      type: "transition",
      description: "Transition used to open/close the tooltip.",
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "tooltip",
      "Tooltip",
      (_scales, _breakpoints, tokens) =>
        generateTooltipSources({
          backgroundColor: tokens.backgroundColor!,
          color: tokens.color!,
          typography: tokens.typography!,
          borderRadius: tokens.borderRadius!,
          border: tokens.border!,
          shadow: tokens.shadow!,
          horizontalSpacing: tokens.horizontalSpacing!,
          verticalSpacing: tokens.verticalSpacing!,
          offset: tokens.offset!,
          maxWidth: tokens.maxWidth!,
          arrowSize: tokens.arrowSize!,
          transition: tokens.transition!,
          showArrow: SHOW_ARROW,
        }),
      { "@base-ui/react": "^1.0.0" },
    ),
  },
});
