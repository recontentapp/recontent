import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateButtonSources } from "./vanilla-extract.js";

type ButtonVariantFields = {
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

type ButtonSizeFields = {
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  typography: TokenBinding<"typography">;
  gap: TokenBinding<"dimension">;
};

export type ButtonComponentOptions = {
  borderRadius: TokenBinding<"dimension">;
  variants: Record<string, ButtonVariantFields>;
  sizes: Record<string, ButtonSizeFields>;
  focusRingColor: TokenBinding<"color">;
};

export const buttonComponent = defineRegistryComponent<ButtonComponentOptions>()({
  id: "button",
  name: "Button",
  internalDependencies: ["render-element"],
  schema: {
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the button.",
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
    focusRingColor: {
      kind: "token",
      type: "color",
      description: "Outline color shown on keyboard focus.",
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "button",
      "Button",
      (_scales, _breakpoints, tokens) =>
        generateButtonSources({
          borderRadius: tokens.borderRadius!,
          focusRingColor: tokens.focusRingColor!,
          tokens,
        }),
      { "@base-ui/react": "^1.0.0" },
    ),
  },
});
