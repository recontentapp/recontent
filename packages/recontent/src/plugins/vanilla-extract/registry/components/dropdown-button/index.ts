import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import type { IconName } from "../../internal/icon-map/icons.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateDropdownButtonSources } from "./vanilla-extract.js";

type DropdownButtonVariantFields = {
  backgroundColor: TokenBinding<"color">;
  color: TokenBinding<"color">;
  typography: TokenBinding<"typography">;
  border: TokenBinding<"border">;
  hoverBackgroundColor: TokenBinding<"color">;
  hoverColor: TokenBinding<"color">;
  hoverBorder: TokenBinding<"border">;
  disabledBackgroundColor: TokenBinding<"color">;
  disabledColor: TokenBinding<"color">;
  disabledBorder: TokenBinding<"border">;
};

type DropdownButtonSizeFields = {
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  typography: TokenBinding<"typography">;
  gap: TokenBinding<"dimension">;
};

export type DropdownButtonComponentOptions = {
  borderRadius: TokenBinding<"dimension">;
  variants: Record<string, DropdownButtonVariantFields>;
  sizes: Record<string, DropdownButtonSizeFields>;
  popupBackgroundColor: TokenBinding<"color">;
  popupBorder: TokenBinding<"border">;
  popupBorderRadius: TokenBinding<"dimension">;
  popupShadow: TokenBinding<"shadow">;
  popupSpacing: TokenBinding<"dimension">;
  popupOffset: TokenBinding<"dimension">;
  itemColor: TokenBinding<"color">;
  itemTypography: TokenBinding<"typography">;
  itemHoverBackgroundColor: TokenBinding<"color">;
  itemDisabledColor: TokenBinding<"color">;
  itemHorizontalSpacing: TokenBinding<"dimension">;
  itemVerticalSpacing: TokenBinding<"dimension">;
  itemIconSize: TokenBinding<"dimension">;
  indicatorIcon: IconName;
};

export const dropdownButtonComponent = defineRegistryComponent<DropdownButtonComponentOptions>()({
  id: "dropdown-button",
  name: "DropdownButton",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the trigger button.",
    },
    variants: {
      kind: "variants",
      description: "Consumer-defined visual variants, drives the variant prop.",
      fields: {
        backgroundColor: { kind: "token", type: "color" },
        color: { kind: "token", type: "color" },
        typography: { kind: "token", type: "typography" },
        border: { kind: "token", type: "border" },
        hoverBackgroundColor: { kind: "token", type: "color" },
        hoverColor: { kind: "token", type: "color" },
        hoverBorder: { kind: "token", type: "border" },
        disabledBackgroundColor: { kind: "token", type: "color" },
        disabledColor: { kind: "token", type: "color" },
        disabledBorder: { kind: "token", type: "border" },
      },
    },
    sizes: {
      kind: "variants",
      description: "Consumer-defined sizes, drives the size prop.",
      fields: {
        horizontalSpacing: { kind: "token", type: "dimension" },
        verticalSpacing: { kind: "token", type: "dimension" },
        typography: { kind: "token", type: "typography" },
        gap: { kind: "token", type: "dimension" },
      },
    },
    popupBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the item list popup.",
    },
    popupBorder: {
      kind: "token",
      type: "border",
      description: "Border applied around the popup.",
    },
    popupBorderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius of the popup.",
    },
    popupShadow: {
      kind: "token",
      type: "shadow",
      description: "Shadow applied to the popup.",
    },
    popupSpacing: {
      kind: "token",
      type: "dimension",
      description: "Padding around the item list, inside the popup.",
    },
    popupOffset: {
      kind: "token",
      type: "dimension",
      description: "Gap between the trigger and the popup.",
    },
    itemColor: {
      kind: "token",
      type: "color",
      description: "Text color of a menu item.",
    },
    itemTypography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to a menu item's label.",
    },
    itemHoverBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of a highlighted menu item.",
    },
    itemDisabledColor: {
      kind: "token",
      type: "color",
      description: "Text color of a disabled menu item.",
    },
    itemHorizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of a menu item.",
    },
    itemVerticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of a menu item.",
    },
    itemIconSize: {
      kind: "token",
      type: "dimension",
      description: "Size of a menu item's leading icon.",
    },
    indicatorIcon: { kind: "icon", description: "Icon rendered at the end of the trigger." },
  },
  output: vanillaExtractComponentOutput(
    "dropdown-button",
    "DropdownButton",
    (_scales, _breakpoints, tokens, focusRingColor, icons) =>
      generateDropdownButtonSources({
        borderRadius: tokens.borderRadius!,
        popupBackgroundColor: tokens.popupBackgroundColor!,
        popupBorder: tokens.popupBorder!,
        popupBorderRadius: tokens.popupBorderRadius!,
        popupShadow: tokens.popupShadow!,
        popupSpacing: tokens.popupSpacing!,
        popupOffset: tokens.popupOffset!,
        itemColor: tokens.itemColor!,
        itemTypography: tokens.itemTypography!,
        itemHoverBackgroundColor: tokens.itemHoverBackgroundColor!,
        itemDisabledColor: tokens.itemDisabledColor!,
        itemHorizontalSpacing: tokens.itemHorizontalSpacing!,
        itemVerticalSpacing: tokens.itemVerticalSpacing!,
        itemIconSize: tokens.itemIconSize!,
        indicatorIcon: icons.indicatorIcon!,
        tokens,
        focusRingColor,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
