import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import type { IconName } from "../../internal/icon-map/icons.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateDrawerSources } from "./vanilla-extract.js";

export type DrawerComponentOptions = {
  backdropColor: TokenBinding<"color">;
  backgroundColor: TokenBinding<"color">;
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
  shadow: TokenBinding<"shadow">;
  /** Fixed keys, matching the `size` prop's literal union. */
  sizes: Record<"sm" | "md" | "lg" | "full", { size: TokenBinding<"dimension"> }>;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
  titleTypography: TokenBinding<"typography">;
  titleColor: TokenBinding<"color">;
  footerBorder: TokenBinding<"border">;
  transition: TokenBinding<"transition">;
  closeIcon: IconName;
};

export const drawerComponent = defineRegistryComponent<DrawerComponentOptions>()({
  id: "drawer",
  name: "Drawer",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    backdropColor: { kind: "token", type: "color", description: "Background color of the backdrop." },
    backgroundColor: { kind: "token", type: "color", description: "Background color of the drawer." },
    border: { kind: "token", type: "border", description: "Border applied around the drawer." },
    borderRadius: { kind: "token", type: "dimension", description: "Corner radius applied to the drawer." },
    shadow: { kind: "token", type: "shadow", description: "Shadow applied to the drawer." },
    sizes: {
      kind: "variants",
      description: "Drawer's fixed sizes (sm | md | lg | full), drives the size prop.",
      fields: {
        size: { kind: "token", type: "dimension" },
      },
    },
    horizontalSpacing: { kind: "token", type: "dimension", description: "Left/right padding of the drawer." },
    verticalSpacing: { kind: "token", type: "dimension", description: "Top/bottom padding of the drawer." },
    gap: { kind: "token", type: "dimension", description: "Space between the header, body and footer." },
    titleTypography: { kind: "token", type: "typography", description: "Typography of the title." },
    titleColor: { kind: "token", type: "color", description: "Text color of the title." },
    footerBorder: { kind: "token", type: "border", description: "Border above the footer." },
    transition: { kind: "token", type: "transition", description: "Transition used to slide the drawer in/out." },
    closeIcon: { kind: "icon", description: "Icon used by the close button." },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "drawer",
      "Drawer",
      (_scales, _breakpoints, tokens, focusRingColor, icons) =>
        generateDrawerSources({
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
