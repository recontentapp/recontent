import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import type { IconName } from "../../internal/icon-map/icons.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateBreadcrumbSources } from "./vanilla-extract.js";

export type BreadcrumbComponentOptions = {
  typography: TokenBinding<"typography">;
  color: TokenBinding<"color">;
  hoverColor: TokenBinding<"color">;
  currentColor: TokenBinding<"color">;
  currentTypography: TokenBinding<"typography">;
  separatorColor: TokenBinding<"color">;
  gap: TokenBinding<"dimension">;
  iconSize: TokenBinding<"dimension">;
  separatorIcon: IconName;
  overflowIcon: IconName;
};

export const breadcrumbComponent = defineRegistryComponent<BreadcrumbComponentOptions>()({
  id: "breadcrumb",
  name: "Breadcrumb",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    typography: { kind: "token", type: "typography", description: "Typography applied to items." },
    color: { kind: "token", type: "color", description: "Text color of a navigable item." },
    hoverColor: {
      kind: "token",
      type: "color",
      description: "Text color of a navigable item on hover.",
    },
    currentColor: {
      kind: "token",
      type: "color",
      description: "Text color of the last, non-navigable item.",
    },
    currentTypography: {
      kind: "token",
      type: "typography",
      description: "Typography of the last item.",
    },
    separatorColor: {
      kind: "token",
      type: "color",
      description: "Color of the separator between items.",
    },
    gap: { kind: "token", type: "dimension", description: "Space between items." },
    iconSize: { kind: "token", type: "dimension", description: "Size of an item's leading icon." },
    separatorIcon: { kind: "icon", description: "Icon rendered between items." },
    overflowIcon: {
      kind: "icon",
      description: "Icon rendered by the overflow menu trigger.",
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "breadcrumb",
      "Breadcrumb",
      (_scales, _breakpoints, tokens, focusRingColor, icons) =>
        generateBreadcrumbSources({
          typography: tokens.typography!,
          color: tokens.color!,
          hoverColor: tokens.hoverColor!,
          currentColor: tokens.currentColor!,
          currentTypography: tokens.currentTypography!,
          separatorColor: tokens.separatorColor!,
          gap: tokens.gap!,
          iconSize: tokens.iconSize!,
          separatorIcon: icons.separatorIcon!,
          overflowIcon: icons.overflowIcon!,
          focusRingColor,
        }),
    ),
  },
});
