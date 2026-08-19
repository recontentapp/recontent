import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateTabsSources } from "./vanilla-extract.js";

type TabsVariantFields = {
  color: TokenBinding<"color">;
  activeColor: TokenBinding<"color">;
  hoverColor: TokenBinding<"color">;
  backgroundColor: TokenBinding<"color">;
  activeBackgroundColor: TokenBinding<"color">;
  indicatorColor: TokenBinding<"color">;
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
};

export type TabsComponentOptions = {
  variants: Record<string, TabsVariantFields>;
  typography: TokenBinding<"typography">;
  activeTypography: TokenBinding<"typography">;
  disabledColor: TokenBinding<"color">;
  indicatorThickness: TokenBinding<"dimension">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
  tabGap: TokenBinding<"dimension">;
  panelSpacing: TokenBinding<"dimension">;
  iconSize: TokenBinding<"dimension">;
};

export const tabsComponent = defineRegistryComponent<TabsComponentOptions>()({
  id: "tabs",
  name: "Tabs",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    variants: {
      kind: "variants",
      description: "Consumer-defined visual variants, drives the variant prop.",
      fields: {
        color: { kind: "token", type: "color" },
        activeColor: { kind: "token", type: "color" },
        hoverColor: { kind: "token", type: "color" },
        backgroundColor: { kind: "token", type: "color" },
        activeBackgroundColor: { kind: "token", type: "color" },
        indicatorColor: { kind: "token", type: "color" },
        border: { kind: "token", type: "border" },
        borderRadius: { kind: "token", type: "dimension" },
      },
    },
    typography: { kind: "token", type: "typography", description: "Typography of a tab." },
    activeTypography: { kind: "token", type: "typography", description: "Typography of the active tab." },
    disabledColor: { kind: "token", type: "color", description: "Text color of a disabled tab." },
    indicatorThickness: { kind: "token", type: "dimension", description: "Thickness of the active indicator." },
    horizontalSpacing: { kind: "token", type: "dimension", description: "Left/right padding of a tab." },
    verticalSpacing: { kind: "token", type: "dimension", description: "Top/bottom padding of a tab." },
    gap: { kind: "token", type: "dimension", description: "Space between tabs." },
    tabGap: { kind: "token", type: "dimension", description: "Space between a tab's icon and label." },
    panelSpacing: { kind: "token", type: "dimension", description: "Padding of the active panel." },
    iconSize: { kind: "token", type: "dimension", description: "Size of a tab's icon." },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "tabs",
      "Tabs",
      (_scales, _breakpoints, tokens, focusRingColor) =>
        generateTabsSources({
          typography: tokens.typography!,
          activeTypography: tokens.activeTypography!,
          disabledColor: tokens.disabledColor!,
          indicatorThickness: tokens.indicatorThickness!,
          horizontalSpacing: tokens.horizontalSpacing!,
          verticalSpacing: tokens.verticalSpacing!,
          gap: tokens.gap!,
          tabGap: tokens.tabGap!,
          panelSpacing: tokens.panelSpacing!,
          iconSize: tokens.iconSize!,
          focusRingColor,
          tokens,
        }),
      { "@base-ui/react": "^1.0.0" },
    ),
  },
});
