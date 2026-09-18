import type { ScaleBinding, TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateMetadataListSources } from "./vanilla-extract.js";

export type MetadataListComponentOptions = {
  gaps: ScaleBinding<"dimension">;
  labelTypography: TokenBinding<"typography">;
  labelColor: TokenBinding<"color">;
  valueTypography: TokenBinding<"typography">;
  valueColor: TokenBinding<"color">;
  pairGap: TokenBinding<"dimension">;
  iconSize: TokenBinding<"dimension">;
  iconColor: TokenBinding<"color">;
  divider: TokenBinding<"border">;
};

export const metadataListComponent = defineRegistryComponent<MetadataListComponentOptions>()({
  id: "metadata-list",
  name: "MetadataList",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    gaps: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the gap prop.",
    },
    labelTypography: { kind: "token", type: "typography", description: "Typography of a label." },
    labelColor: { kind: "token", type: "color", description: "Text color of a label." },
    valueTypography: { kind: "token", type: "typography", description: "Typography of a value." },
    valueColor: { kind: "token", type: "color", description: "Text color of a value." },
    pairGap: {
      kind: "token",
      type: "dimension",
      description: "Space between a label and its value.",
    },
    iconSize: { kind: "token", type: "dimension", description: "Size of an item's icon." },
    iconColor: { kind: "token", type: "color", description: "Color of an item's icon." },
    divider: { kind: "token", type: "border", description: "Border applied between rows." },
  },
  output: vanillaExtractComponentOutput(
    "metadata-list",
    "MetadataList",
    (scales, _breakpoints, tokens) =>
      generateMetadataListSources({
        gaps: scales.gaps!,
        labelTypography: tokens.labelTypography!,
        labelColor: tokens.labelColor!,
        valueTypography: tokens.valueTypography!,
        valueColor: tokens.valueColor!,
        pairGap: tokens.pairGap!,
        iconSize: tokens.iconSize!,
        iconColor: tokens.iconColor!,
        divider: tokens.divider!,
      }),
  ),
});
