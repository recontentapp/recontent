import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import type { IconName } from "../../internal/icon-map/icons.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generatePaginationSources } from "./vanilla-extract.js";

type PaginationSizeFields = {
  minSize: TokenBinding<"dimension">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  typography: TokenBinding<"typography">;
};

export type PaginationComponentOptions = {
  borderRadius: TokenBinding<"dimension">;
  border: TokenBinding<"border">;
  typography: TokenBinding<"typography">;
  color: TokenBinding<"color">;
  backgroundColor: TokenBinding<"color">;
  hoverColor: TokenBinding<"color">;
  hoverBackgroundColor: TokenBinding<"color">;
  activeColor: TokenBinding<"color">;
  activeBackgroundColor: TokenBinding<"color">;
  disabledColor: TokenBinding<"color">;
  ellipsisColor: TokenBinding<"color">;
  sizes: Record<string, PaginationSizeFields>;
  gap: TokenBinding<"dimension">;
  iconSize: TokenBinding<"dimension">;
  previousIcon: IconName;
  nextIcon: IconName;
  firstIcon: IconName;
  lastIcon: IconName;
};

export const paginationComponent = defineRegistryComponent<PaginationComponentOptions>()({
  id: "pagination",
  name: "Pagination",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius of a page control.",
    },
    border: { kind: "token", type: "border", description: "Border applied around a page control." },
    typography: { kind: "token", type: "typography", description: "Typography of a page control." },
    color: { kind: "token", type: "color", description: "Text color of a page control." },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of a page control.",
    },
    hoverColor: {
      kind: "token",
      type: "color",
      description: "Text color of a page control on hover.",
    },
    hoverBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of a page control on hover.",
    },
    activeColor: { kind: "token", type: "color", description: "Text color of the active page." },
    activeBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the active page.",
    },
    disabledColor: {
      kind: "token",
      type: "color",
      description: "Text color of a disabled control.",
    },
    ellipsisColor: { kind: "token", type: "color", description: "Color of the ellipsis." },
    sizes: {
      kind: "variants",
      description: "Consumer-defined sizes, drives the size prop.",
      fields: {
        minSize: { kind: "token", type: "dimension" },
        horizontalSpacing: { kind: "token", type: "dimension" },
        verticalSpacing: { kind: "token", type: "dimension" },
        typography: { kind: "token", type: "typography" },
      },
    },
    gap: { kind: "token", type: "dimension", description: "Space between page controls." },
    iconSize: { kind: "token", type: "dimension", description: "Size of the navigation icons." },
    previousIcon: { kind: "icon", description: "Icon used to navigate to the previous page." },
    nextIcon: { kind: "icon", description: "Icon used to navigate to the next page." },
    firstIcon: { kind: "icon", description: "Icon used to navigate to the first page." },
    lastIcon: { kind: "icon", description: "Icon used to navigate to the last page." },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "pagination",
      "Pagination",
      (_scales, _breakpoints, tokens, focusRingColor, icons) =>
        generatePaginationSources({
          borderRadius: tokens.borderRadius!,
          border: tokens.border!,
          typography: tokens.typography!,
          color: tokens.color!,
          backgroundColor: tokens.backgroundColor!,
          hoverColor: tokens.hoverColor!,
          hoverBackgroundColor: tokens.hoverBackgroundColor!,
          activeColor: tokens.activeColor!,
          activeBackgroundColor: tokens.activeBackgroundColor!,
          disabledColor: tokens.disabledColor!,
          ellipsisColor: tokens.ellipsisColor!,
          gap: tokens.gap!,
          iconSize: tokens.iconSize!,
          previousIcon: icons.previousIcon!,
          nextIcon: icons.nextIcon!,
          firstIcon: icons.firstIcon!,
          lastIcon: icons.lastIcon!,
          tokens,
          focusRingColor,
        }),
      { "@base-ui/react": "^1.0.0" },
    ),
  },
});
