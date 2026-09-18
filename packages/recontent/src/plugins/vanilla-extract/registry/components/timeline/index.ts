import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateTimelineSources } from "./vanilla-extract.js";

type TimelineStatusFields = {
  indicatorColor: TokenBinding<"color">;
  indicatorBackgroundColor: TokenBinding<"color">;
  indicatorBorder: TokenBinding<"border">;
};

type TimelineSizeFields = {
  indicatorSize: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
  typography: TokenBinding<"typography">;
};

export type TimelineComponentOptions = {
  statuses: Record<string, TimelineStatusFields>;
  sizes: Record<string, TimelineSizeFields>;
  connectorColor: TokenBinding<"color">;
  connectorThickness: TokenBinding<"dimension">;
  connectorSpacing: TokenBinding<"dimension">;
  labelTypography: TokenBinding<"typography">;
  labelColor: TokenBinding<"color">;
  descriptionTypography: TokenBinding<"typography">;
  descriptionColor: TokenBinding<"color">;
  timestampTypography: TokenBinding<"typography">;
  timestampColor: TokenBinding<"color">;
  itemGap: TokenBinding<"dimension">;
  iconSize: TokenBinding<"dimension">;
};

export const timelineComponent = defineRegistryComponent<TimelineComponentOptions>()({
  id: "timeline",
  name: "Timeline",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    statuses: {
      kind: "variants",
      description: "Timeline's own palette, consumer-defined keys, drives each item's status prop.",
      fields: {
        indicatorColor: { kind: "token", type: "color" },
        indicatorBackgroundColor: { kind: "token", type: "color" },
        indicatorBorder: { kind: "token", type: "border" },
      },
    },
    sizes: {
      kind: "variants",
      description: "Consumer-defined sizes, drives the size prop.",
      fields: {
        indicatorSize: { kind: "token", type: "dimension" },
        gap: { kind: "token", type: "dimension" },
        typography: { kind: "token", type: "typography" },
      },
    },
    connectorColor: { kind: "token", type: "color", description: "Color of the connector line." },
    connectorThickness: {
      kind: "token",
      type: "dimension",
      description: "Thickness of the connector line.",
    },
    connectorSpacing: {
      kind: "token",
      type: "dimension",
      description: "Margin around the connector line.",
    },
    labelTypography: {
      kind: "token",
      type: "typography",
      description: "Typography of an item's label.",
    },
    labelColor: { kind: "token", type: "color", description: "Text color of an item's label." },
    descriptionTypography: {
      kind: "token",
      type: "typography",
      description: "Typography of an item's description.",
    },
    descriptionColor: {
      kind: "token",
      type: "color",
      description: "Text color of an item's description.",
    },
    timestampTypography: {
      kind: "token",
      type: "typography",
      description: "Typography of an item's timestamp.",
    },
    timestampColor: {
      kind: "token",
      type: "color",
      description: "Text color of an item's timestamp.",
    },
    itemGap: { kind: "token", type: "dimension", description: "Space between items." },
    iconSize: { kind: "token", type: "dimension", description: "Size of an item's icon." },
  },
  output: vanillaExtractComponentOutput("timeline", "Timeline", (_scales, _breakpoints, tokens) =>
    generateTimelineSources({
      connectorColor: tokens.connectorColor!,
      connectorThickness: tokens.connectorThickness!,
      connectorSpacing: tokens.connectorSpacing!,
      labelTypography: tokens.labelTypography!,
      labelColor: tokens.labelColor!,
      descriptionTypography: tokens.descriptionTypography!,
      descriptionColor: tokens.descriptionColor!,
      timestampTypography: tokens.timestampTypography!,
      timestampColor: tokens.timestampColor!,
      itemGap: tokens.itemGap!,
      iconSize: tokens.iconSize!,
      tokens,
    }),
  ),
});
