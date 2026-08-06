import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateIconButtonSources } from "./vanilla-extract.js";

type IconButtonVariantFields = {
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

type IconButtonSizeFields = {
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  iconSize: TokenBinding<"dimension">;
};

export type IconButtonComponentOptions = {
  borderRadius: TokenBinding<"dimension">;
  variants: Record<string, IconButtonVariantFields>;
  sizes: Record<string, IconButtonSizeFields>;
  focusRingColor: TokenBinding<"color">;
};

export const iconButtonComponent = defineRegistryComponent<IconButtonComponentOptions>()({
  id: "icon-button",
  name: "IconButton",
  internalDependencies: ["render-element"],
  schema: {
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the icon button.",
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
        iconSize: { kind: "token", type: "dimension" },
      },
    },
    focusRingColor: {
      kind: "token",
      type: "color",
      description: "Outline color shown on keyboard focus.",
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "icon-button",
      "IconButton",
      (_scales, _breakpoints, tokens) =>
        generateIconButtonSources({
          borderRadius: tokens.borderRadius!,
          focusRingColor: tokens.focusRingColor!,
          tokens,
        }),
      { "@base-ui/react": "^1.0.0" },
    ),
  },
});
