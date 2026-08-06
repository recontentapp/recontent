import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generatePopoverSources } from "./vanilla-extract.js";

export type PopoverComponentOptions = {
  backgroundColor: TokenBinding<"color">;
  color: TokenBinding<"color">;
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
  shadow: TokenBinding<"shadow">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  offset: TokenBinding<"dimension">;
  maxWidth: TokenBinding<"dimension">;
  /** Only used when `modal` is true. */
  backdropColor: TokenBinding<"color">;
  arrowSize: TokenBinding<"dimension">;
  transitionDuration: TokenBinding<"duration">;
};

/**
 * `arrow` is a plain build-time "Option" switch — not a token binding, so it
 * isn't a `ComponentContract` kind either (only "token" | "scale" |
 * "variants" are). Like Tooltip's arrow, it's a build-time choice baked
 * directly into the generated component.
 */
const SHOW_ARROW = true;

export const popoverComponent = defineRegistryComponent<PopoverComponentOptions>()({
  id: "popover",
  name: "Popover",
  internalDependencies: ["render-element"],
  schema: {
    backgroundColor: { kind: "token", type: "color", description: "Background color of the popover." },
    color: { kind: "token", type: "color", description: "Text color of the popover." },
    border: { kind: "token", type: "border", description: "Border applied around the popover." },
    borderRadius: { kind: "token", type: "dimension", description: "Corner radius applied to the popover." },
    shadow: { kind: "token", type: "shadow", description: "Shadow applied to the popover." },
    horizontalSpacing: { kind: "token", type: "dimension", description: "Left/right padding of the popover." },
    verticalSpacing: { kind: "token", type: "dimension", description: "Top/bottom padding of the popover." },
    offset: { kind: "token", type: "dimension", description: "Gap between the trigger and the popover." },
    maxWidth: { kind: "token", type: "dimension", description: "Maximum width of the popover." },
    backdropColor: {
      kind: "token",
      type: "color",
      description: "Background color of the backdrop, shown only when modal.",
    },
    arrowSize: { kind: "token", type: "dimension", description: "Size of the arrow." },
    transitionDuration: { kind: "token", type: "duration", description: "Duration of the open/close transition." },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "popover",
      "Popover",
      (_scales, _breakpoints, tokens) =>
        generatePopoverSources({
          backgroundColor: tokens.backgroundColor!,
          color: tokens.color!,
          border: tokens.border!,
          borderRadius: tokens.borderRadius!,
          shadow: tokens.shadow!,
          horizontalSpacing: tokens.horizontalSpacing!,
          verticalSpacing: tokens.verticalSpacing!,
          offset: tokens.offset!,
          maxWidth: tokens.maxWidth!,
          backdropColor: tokens.backdropColor!,
          arrowSize: tokens.arrowSize!,
          transitionDuration: tokens.transitionDuration!,
          showArrow: SHOW_ARROW,
        }),
      { "@base-ui/react": "^1.0.0" },
    ),
  },
});
