import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import type { IconName } from "../../internal/icon-map/icons.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateCheckboxSources } from "./vanilla-extract.js";

type CheckboxSizeFields = {
  boxSize: TokenBinding<"dimension">;
  labelTypography: TokenBinding<"typography">;
};

export type CheckboxComponentOptions = {
  sizes: Record<string, CheckboxSizeFields>;
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
  backgroundColor: TokenBinding<"color">;
  checkedBackgroundColor: TokenBinding<"color">;
  checkedColor: TokenBinding<"color">;
  hoverBorderColor: TokenBinding<"color">;
  invalidBorderColor: TokenBinding<"color">;
  disabledBackgroundColor: TokenBinding<"color">;
  disabledColor: TokenBinding<"color">;
  labelColor: TokenBinding<"color">;
  gap: TokenBinding<"dimension">;
  checkedIcon: IconName;
  indeterminateIcon: IconName;
};

export const checkboxComponent = defineRegistryComponent<CheckboxComponentOptions>()({
  id: "checkbox",
  name: "Checkbox",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    sizes: {
      kind: "variants",
      description:
        "Consumer-defined sizes, drives the size prop. Pairs the box dimension with the label's typography so both scale together.",
      fields: {
        boxSize: { kind: "token", type: "dimension" },
        labelTypography: { kind: "token", type: "typography" },
      },
    },
    border: {
      kind: "token",
      type: "border",
      description: "Border applied around the box.",
    },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the box.",
    },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the box when unchecked.",
    },
    checkedBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the box when checked.",
    },
    checkedColor: {
      kind: "token",
      type: "color",
      description: "Color of the check mark.",
    },
    hoverBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the box on hover.",
    },
    invalidBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the box when invalid.",
    },
    disabledBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the box when disabled.",
    },
    disabledColor: {
      kind: "token",
      type: "color",
      description: "Color of the check mark when disabled.",
    },
    labelColor: {
      kind: "token",
      type: "color",
      description: "Text color of the label.",
    },
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between the box and the label.",
    },
    checkedIcon: { kind: "icon", description: "Icon shown when checked." },
    indeterminateIcon: { kind: "icon", description: "Icon shown when indeterminate." },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "checkbox",
      "Checkbox",
      (_scales, _breakpoints, tokens, focusRingColor, icons) =>
        generateCheckboxSources({
          border: tokens.border!,
          borderRadius: tokens.borderRadius!,
          backgroundColor: tokens.backgroundColor!,
          checkedBackgroundColor: tokens.checkedBackgroundColor!,
          checkedColor: tokens.checkedColor!,
          hoverBorderColor: tokens.hoverBorderColor!,
          focusRingColor,
          invalidBorderColor: tokens.invalidBorderColor!,
          disabledBackgroundColor: tokens.disabledBackgroundColor!,
          disabledColor: tokens.disabledColor!,
          labelColor: tokens.labelColor!,
          gap: tokens.gap!,
          tokens,
          checkedIcon: icons.checkedIcon!,
          indeterminateIcon: icons.indeterminateIcon!,
        }),
      { "@base-ui/react": "^1.0.0" },
    ),
  },
});
