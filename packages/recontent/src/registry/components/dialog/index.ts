import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import type { IconName } from "../../internal/icon-map/icons.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateDialogSources } from "./vanilla-extract.js";

export type DialogComponentOptions = {
  backdropColor: TokenBinding<"color">;
  backgroundColor: TokenBinding<"color">;
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
  shadow: TokenBinding<"shadow">;
  /** Fixed keys, matching the `size` prop's literal union. */
  sizes: Record<"sm" | "md" | "lg" | "fullscreen", { maxWidth: TokenBinding<"dimension"> }>;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
  titleTypography: TokenBinding<"typography">;
  titleColor: TokenBinding<"color">;
  descriptionTypography: TokenBinding<"typography">;
  descriptionColor: TokenBinding<"color">;
  footerBorder: TokenBinding<"border">;
  transition: TokenBinding<"transition">;
  closeIcon: IconName;
};

export const dialogComponent = defineRegistryComponent<DialogComponentOptions>()({
  id: "dialog",
  name: "Dialog",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    backdropColor: {
      kind: "token",
      type: "color",
      description: "Background color of the backdrop.",
    },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the dialog.",
    },
    border: { kind: "token", type: "border", description: "Border applied around the dialog." },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the dialog.",
    },
    shadow: { kind: "token", type: "shadow", description: "Shadow applied to the dialog." },
    sizes: {
      kind: "variants",
      description: "Dialog's fixed sizes (sm | md | lg | fullscreen), drives the size prop.",
      fields: {
        maxWidth: { kind: "token", type: "dimension" },
      },
    },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the dialog.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the dialog.",
    },
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between the header, body and footer.",
    },
    titleTypography: { kind: "token", type: "typography", description: "Typography of the title." },
    titleColor: { kind: "token", type: "color", description: "Text color of the title." },
    descriptionTypography: {
      kind: "token",
      type: "typography",
      description: "Typography of the description.",
    },
    descriptionColor: {
      kind: "token",
      type: "color",
      description: "Text color of the description.",
    },
    footerBorder: { kind: "token", type: "border", description: "Border above the footer." },
    transition: {
      kind: "token",
      type: "transition",
      description: "Transition used to open/close the dialog.",
    },
    closeIcon: { kind: "icon", description: "Icon used by the close button." },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "dialog",
      "Dialog",
      (_scales, _breakpoints, tokens, focusRingColor, icons) =>
        generateDialogSources({
          backdropColor: tokens.backdropColor!,
          backgroundColor: tokens.backgroundColor!,
          border: tokens.border!,
          borderRadius: tokens.borderRadius!,
          shadow: tokens.shadow!,
          horizontalSpacing: tokens.horizontalSpacing!,
          verticalSpacing: tokens.verticalSpacing!,
          gap: tokens.gap!,
          titleTypography: tokens.titleTypography!,
          titleColor: tokens.titleColor!,
          descriptionTypography: tokens.descriptionTypography!,
          descriptionColor: tokens.descriptionColor!,
          footerBorder: tokens.footerBorder!,
          transition: tokens.transition!,
          closeIcon: icons.closeIcon!,
          tokens,
          focusRingColor,
        }),
      { "@base-ui/react": "^1.0.0" },
    ),
  },
});
