import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateBadgeSources } from "./vanilla-extract.js";

type BadgeStatusFields = {
  color: TokenBinding<"color">;
  backgroundColor: TokenBinding<"color">;
  border: TokenBinding<"border">;
};

type BadgeSizeFields = {
  typography: TokenBinding<"typography">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
  iconSize: TokenBinding<"dimension">;
};

export type BadgeComponentOptions = {
  borderRadius: TokenBinding<"dimension">;
  statuses: Record<string, BadgeStatusFields>;
  sizes: Record<string, BadgeSizeFields>;
};

export const badgeComponent = defineRegistryComponent<BadgeComponentOptions>()({
  id: "badge",
  name: "Badge",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the badge.",
    },
    statuses: {
      kind: "variants",
      description: "Badge's own palette, consumer-defined keys, drives the variant prop.",
      fields: {
        color: { kind: "token", type: "color" },
        backgroundColor: { kind: "token", type: "color" },
        border: { kind: "token", type: "border" },
      },
    },
    sizes: {
      kind: "variants",
      description: "Consumer-defined sizes, drives the size prop.",
      fields: {
        typography: { kind: "token", type: "typography" },
        horizontalSpacing: { kind: "token", type: "dimension" },
        verticalSpacing: { kind: "token", type: "dimension" },
        gap: { kind: "token", type: "dimension" },
        iconSize: { kind: "token", type: "dimension" },
      },
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "badge",
      "Badge",
      (_scales, _breakpoints, tokens) =>
        generateBadgeSources({
          borderRadius: tokens.borderRadius!,
          tokens,
        }),
    ),
  },
});
