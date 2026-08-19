import type { ScaleBinding, TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateCheckboxSources } from "./vanilla-extract.js";

export type CheckboxComponentOptions = {
  sizes: ScaleBinding<"dimension">;
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
  backgroundColor: TokenBinding<"color">;
  checkedBackgroundColor: TokenBinding<"color">;
  checkedColor: TokenBinding<"color">;
  hoverBorderColor: TokenBinding<"color">;
  invalidBorderColor: TokenBinding<"color">;
  disabledBackgroundColor: TokenBinding<"color">;
  disabledColor: TokenBinding<"color">;
  labelTypography: TokenBinding<"typography">;
  labelColor: TokenBinding<"color">;
  gap: TokenBinding<"dimension">;
};

/**
 * Icon shown when checked/indeterminate. Not token bindings (Icon isn't a
 * `ComponentContract` kind), so — like Collapsible's indicator — these are
 * build-time choices baked directly into the generated component.
 */
const CHECKED_ICON = "check";
const INDETERMINATE_ICON = "close";

export const checkboxComponent = defineRegistryComponent<CheckboxComponentOptions>()({
  id: "checkbox",
  name: "Checkbox",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    sizes: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the size prop.",
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
    labelTypography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to the label.",
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
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "checkbox",
      "Checkbox",
      (scales, _breakpoints, tokens, focusRingColor) =>
        generateCheckboxSources({
          sizes: scales.sizes!,
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
          labelTypography: tokens.labelTypography!,
          labelColor: tokens.labelColor!,
          gap: tokens.gap!,
          checkedIcon: CHECKED_ICON,
          indeterminateIcon: INDETERMINATE_ICON,
        }),
      { "@base-ui/react": "^1.0.0" },
    ),
  },
});
