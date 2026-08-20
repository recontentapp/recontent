import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import type { IconName } from "../../internal/icon-map/icons.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateFieldSources } from "./vanilla-extract.js";

export type FieldComponentOptions = {
  labelTypography: TokenBinding<"typography">;
  labelColor: TokenBinding<"color">;
  descriptionTypography: TokenBinding<"typography">;
  descriptionColor: TokenBinding<"color">;
  errorTypography: TokenBinding<"typography">;
  errorColor: TokenBinding<"color">;
  requiredIndicatorColor: TokenBinding<"color">;
  optionalTypography: TokenBinding<"typography">;
  optionalColor: TokenBinding<"color">;
  gap: TokenBinding<"dimension">;
  iconSize: TokenBinding<"dimension">;
  errorIcon: IconName;
};

export const fieldComponent = defineRegistryComponent<FieldComponentOptions>()({
  id: "field",
  name: "Field",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    labelTypography: { kind: "token", type: "typography", description: "Typography applied to the label." },
    labelColor: { kind: "token", type: "color", description: "Text color of the label." },
    descriptionTypography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to the description.",
    },
    descriptionColor: { kind: "token", type: "color", description: "Text color of the description." },
    errorTypography: { kind: "token", type: "typography", description: "Typography applied to the error text." },
    errorColor: { kind: "token", type: "color", description: "Text color of the error text." },
    requiredIndicatorColor: {
      kind: "token",
      type: "color",
      description: "Color of the required indicator next to the label.",
    },
    optionalTypography: {
      kind: "token",
      type: "typography",
      description: "Typography of the optional text next to the label.",
    },
    optionalColor: { kind: "token", type: "color", description: "Text color of the optional text." },
    gap: { kind: "token", type: "dimension", description: "Space between the label, control and helper text." },
    iconSize: { kind: "token", type: "dimension", description: "Size of the error icon." },
    errorIcon: { kind: "icon", description: "Icon rendered next to the error text." },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "field",
      "Field",
      (_scales, _breakpoints, tokens, _focusRingColor, icons) =>
        generateFieldSources({
          labelTypography: tokens.labelTypography!,
          labelColor: tokens.labelColor!,
          descriptionTypography: tokens.descriptionTypography!,
          descriptionColor: tokens.descriptionColor!,
          errorTypography: tokens.errorTypography!,
          errorColor: tokens.errorColor!,
          requiredIndicatorColor: tokens.requiredIndicatorColor!,
          optionalTypography: tokens.optionalTypography!,
          optionalColor: tokens.optionalColor!,
          gap: tokens.gap!,
          iconSize: tokens.iconSize!,
          errorIcon: icons.errorIcon!,
        }),
      { "@base-ui/react": "^1.0.0" },
    ),
  },
});
