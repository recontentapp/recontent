import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import type { IconName } from "../../internal/icon-map/icons.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateSelectSources } from "./vanilla-extract.js";

export type SelectComponentOptions = {
  borderRadius: TokenBinding<"dimension">;
  border: TokenBinding<"border">;
  backgroundColor: TokenBinding<"color">;
  color: TokenBinding<"color">;
  typography: TokenBinding<"typography">;
  placeholderColor: TokenBinding<"color">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  hoverBorderColor: TokenBinding<"color">;
  focusBorderColor: TokenBinding<"color">;
  invalidBorderColor: TokenBinding<"color">;
  disabledBackgroundColor: TokenBinding<"color">;
  disabledColor: TokenBinding<"color">;
  iconSize: TokenBinding<"dimension">;
  popupBackgroundColor: TokenBinding<"color">;
  popupBorder: TokenBinding<"border">;
  popupBorderRadius: TokenBinding<"dimension">;
  popupShadow: TokenBinding<"shadow">;
  popupSpacing: TokenBinding<"dimension">;
  popupOffset: TokenBinding<"dimension">;
  itemColor: TokenBinding<"color">;
  itemTypography: TokenBinding<"typography">;
  itemHoverBackgroundColor: TokenBinding<"color">;
  itemSelectedBackgroundColor: TokenBinding<"color">;
  itemSelectedColor: TokenBinding<"color">;
  itemDisabledColor: TokenBinding<"color">;
  itemHorizontalSpacing: TokenBinding<"dimension">;
  itemVerticalSpacing: TokenBinding<"dimension">;
  indicatorIcon: IconName;
  selectedIcon: IconName;
  clearIcon: IconName;
};

export const selectComponent = defineRegistryComponent<SelectComponentOptions>()({
  id: "select",
  name: "Select",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius of the trigger.",
    },
    border: { kind: "token", type: "border", description: "Border applied around the trigger." },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the trigger.",
    },
    color: { kind: "token", type: "color", description: "Text color of the selected value." },
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to the trigger.",
    },
    placeholderColor: {
      kind: "token",
      type: "color",
      description: "Text color of the placeholder.",
    },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the trigger.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the trigger.",
    },
    hoverBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the trigger on hover.",
    },
    focusBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the trigger on focus.",
    },
    invalidBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the trigger when invalid.",
    },
    disabledBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the trigger when disabled.",
    },
    disabledColor: {
      kind: "token",
      type: "color",
      description: "Text color of the trigger when disabled.",
    },
    iconSize: { kind: "token", type: "dimension", description: "Size of the trigger/item icons." },
    popupBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the popup.",
    },
    popupBorder: { kind: "token", type: "border", description: "Border applied around the popup." },
    popupBorderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius of the popup.",
    },
    popupShadow: { kind: "token", type: "shadow", description: "Shadow applied to the popup." },
    popupSpacing: {
      kind: "token",
      type: "dimension",
      description: "Padding around the item list.",
    },
    popupOffset: {
      kind: "token",
      type: "dimension",
      description: "Gap between the trigger and the popup.",
    },
    itemColor: { kind: "token", type: "color", description: "Text color of an item." },
    itemTypography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to an item.",
    },
    itemHoverBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of a highlighted item.",
    },
    itemSelectedBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the selected item.",
    },
    itemSelectedColor: {
      kind: "token",
      type: "color",
      description: "Text color of the selected item.",
    },
    itemDisabledColor: {
      kind: "token",
      type: "color",
      description: "Text color of a disabled item.",
    },
    itemHorizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of an item.",
    },
    itemVerticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of an item.",
    },
    indicatorIcon: { kind: "icon", description: "Icon rendered at the end of the trigger." },
    selectedIcon: { kind: "icon", description: "Icon marking the selected item." },
    clearIcon: { kind: "icon", description: "Icon used by the clear button." },
  },
  output: vanillaExtractComponentOutput(
    "select",
    "Select",
    (_scales, _breakpoints, tokens, focusRingColor, icons) =>
      generateSelectSources({
        borderRadius: tokens.borderRadius!,
        border: tokens.border!,
        backgroundColor: tokens.backgroundColor!,
        color: tokens.color!,
        typography: tokens.typography!,
        placeholderColor: tokens.placeholderColor!,
        horizontalSpacing: tokens.horizontalSpacing!,
        verticalSpacing: tokens.verticalSpacing!,
        hoverBorderColor: tokens.hoverBorderColor!,
        focusBorderColor: tokens.focusBorderColor!,
        focusRingColor,
        invalidBorderColor: tokens.invalidBorderColor!,
        disabledBackgroundColor: tokens.disabledBackgroundColor!,
        disabledColor: tokens.disabledColor!,
        iconSize: tokens.iconSize!,
        popupBackgroundColor: tokens.popupBackgroundColor!,
        popupBorder: tokens.popupBorder!,
        popupBorderRadius: tokens.popupBorderRadius!,
        popupShadow: tokens.popupShadow!,
        popupSpacing: tokens.popupSpacing!,
        popupOffset: tokens.popupOffset!,
        itemColor: tokens.itemColor!,
        itemTypography: tokens.itemTypography!,
        itemHoverBackgroundColor: tokens.itemHoverBackgroundColor!,
        itemSelectedBackgroundColor: tokens.itemSelectedBackgroundColor!,
        itemSelectedColor: tokens.itemSelectedColor!,
        itemDisabledColor: tokens.itemDisabledColor!,
        itemHorizontalSpacing: tokens.itemHorizontalSpacing!,
        itemVerticalSpacing: tokens.itemVerticalSpacing!,
        indicatorIcon: icons.indicatorIcon!,
        selectedIcon: icons.selectedIcon!,
        clearIcon: icons.clearIcon!,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
