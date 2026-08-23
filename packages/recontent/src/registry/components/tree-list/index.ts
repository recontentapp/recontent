import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import type { IconName } from "../../internal/icon-map/icons.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateTreeListSources } from "./vanilla-extract.js";

export type TreeListComponentOptions = {
  typography: TokenBinding<"typography">;
  color: TokenBinding<"color">;
  hoverBackgroundColor: TokenBinding<"color">;
  selectedBackgroundColor: TokenBinding<"color">;
  selectedColor: TokenBinding<"color">;
  borderRadius: TokenBinding<"dimension">;
  indentSpacing: TokenBinding<"dimension">;
  rowHorizontalSpacing: TokenBinding<"dimension">;
  rowVerticalSpacing: TokenBinding<"dimension">;
  rowGap: TokenBinding<"dimension">;
  guideColor: TokenBinding<"color">;
  iconSize: TokenBinding<"dimension">;
  iconColor: TokenBinding<"color">;
  expandIcon: IconName;
};

export const treeListComponent = defineRegistryComponent<TreeListComponentOptions>()({
  id: "tree-list",
  name: "TreeList",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to a row's label.",
    },
    color: { kind: "token", type: "color", description: "Text color of a row." },
    hoverBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of a row on hover.",
    },
    selectedBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the selected row.",
    },
    selectedColor: { kind: "token", type: "color", description: "Text color of the selected row." },
    borderRadius: { kind: "token", type: "dimension", description: "Corner radius of a row." },
    indentSpacing: {
      kind: "token",
      type: "dimension",
      description: "Indent applied per depth level.",
    },
    rowHorizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of a row.",
    },
    rowVerticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of a row.",
    },
    rowGap: {
      kind: "token",
      type: "dimension",
      description: "Space between the indicator, icon and label.",
    },
    guideColor: { kind: "token", type: "color", description: "Color of the indent guide lines." },
    iconSize: { kind: "token", type: "dimension", description: "Size of a row's icon." },
    iconColor: { kind: "token", type: "color", description: "Color of a row's icon." },
    expandIcon: {
      kind: "icon",
      description: "Icon rendered by a row's expand/collapse indicator.",
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "tree-list",
      "TreeList",
      (_scales, _breakpoints, tokens, focusRingColor, icons) =>
        generateTreeListSources({
          typography: tokens.typography!,
          color: tokens.color!,
          hoverBackgroundColor: tokens.hoverBackgroundColor!,
          selectedBackgroundColor: tokens.selectedBackgroundColor!,
          selectedColor: tokens.selectedColor!,
          focusRingColor,
          borderRadius: tokens.borderRadius!,
          indentSpacing: tokens.indentSpacing!,
          rowHorizontalSpacing: tokens.rowHorizontalSpacing!,
          rowVerticalSpacing: tokens.rowVerticalSpacing!,
          rowGap: tokens.rowGap!,
          guideColor: tokens.guideColor!,
          iconSize: tokens.iconSize!,
          iconColor: tokens.iconColor!,
          expandIcon: icons.expandIcon!,
        }),
    ),
  },
});
