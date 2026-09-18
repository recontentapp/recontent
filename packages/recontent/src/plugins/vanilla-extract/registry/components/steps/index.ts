import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import type { IconName } from "../../internal/icon-map/icons.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateStepsSources } from "./vanilla-extract.js";

type StepsStatusFields = {
  indicatorBackgroundColor: TokenBinding<"color">;
  indicatorColor: TokenBinding<"color">;
  indicatorBorder: TokenBinding<"border">;
  labelColor: TokenBinding<"color">;
  connectorColor: TokenBinding<"color">;
};

type StepsSizeFields = {
  indicatorSize: TokenBinding<"dimension">;
  typography: TokenBinding<"typography">;
  gap: TokenBinding<"dimension">;
};

export type StepsComponentOptions = {
  /** Fixed keys, since Steps derives each step's status from `activeStep`. */
  statuses: Record<"complete" | "current" | "upcoming" | "error", StepsStatusFields>;
  sizes: Record<string, StepsSizeFields>;
  labelTypography: TokenBinding<"typography">;
  descriptionTypography: TokenBinding<"typography">;
  descriptionColor: TokenBinding<"color">;
  connectorThickness: TokenBinding<"dimension">;
  connectorSpacing: TokenBinding<"dimension">;
  indicatorBorderRadius: TokenBinding<"dimension">;
  completeIcon: IconName;
  errorIcon: IconName;
};

export const stepsComponent = defineRegistryComponent<StepsComponentOptions>()({
  id: "steps",
  name: "Steps",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    statuses: {
      kind: "variants",
      description:
        "Steps' fixed status palette (complete | current | upcoming | error), derived from activeStep.",
      fields: {
        indicatorBackgroundColor: { kind: "token", type: "color" },
        indicatorColor: { kind: "token", type: "color" },
        indicatorBorder: { kind: "token", type: "border" },
        labelColor: { kind: "token", type: "color" },
        connectorColor: { kind: "token", type: "color" },
      },
    },
    sizes: {
      kind: "variants",
      description: "Consumer-defined sizes, drives the size prop.",
      fields: {
        indicatorSize: { kind: "token", type: "dimension" },
        typography: { kind: "token", type: "typography" },
        gap: { kind: "token", type: "dimension" },
      },
    },
    labelTypography: {
      kind: "token",
      type: "typography",
      description: "Typography of a step's label.",
    },
    descriptionTypography: {
      kind: "token",
      type: "typography",
      description: "Typography of a step's description.",
    },
    descriptionColor: {
      kind: "token",
      type: "color",
      description: "Text color of a step's description.",
    },
    connectorThickness: {
      kind: "token",
      type: "dimension",
      description: "Thickness of the connector line.",
    },
    connectorSpacing: {
      kind: "token",
      type: "dimension",
      description: "Margin around the connector line.",
    },
    indicatorBorderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius of a step's indicator.",
    },
    completeIcon: { kind: "icon", description: "Icon shown by a completed step's indicator." },
    errorIcon: { kind: "icon", description: "Icon shown by an errored step's indicator." },
  },
  output: vanillaExtractComponentOutput(
    "steps",
    "Steps",
    (_scales, _breakpoints, tokens, _focusRingColor, icons) =>
      generateStepsSources({
        labelTypography: tokens.labelTypography!,
        descriptionTypography: tokens.descriptionTypography!,
        descriptionColor: tokens.descriptionColor!,
        connectorThickness: tokens.connectorThickness!,
        connectorSpacing: tokens.connectorSpacing!,
        indicatorBorderRadius: tokens.indicatorBorderRadius!,
        completeIcon: icons.completeIcon!,
        errorIcon: icons.errorIcon!,
        tokens,
      }),
  ),
});
