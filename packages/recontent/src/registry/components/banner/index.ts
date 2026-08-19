import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateBannerSources } from "./vanilla-extract.js";

type BannerStatusFields = {
  color: TokenBinding<"color">;
  backgroundColor: TokenBinding<"color">;
  borderColor: TokenBinding<"color">;
  iconColor: TokenBinding<"color">;
  titleColor: TokenBinding<"color">;
};

export type BannerComponentOptions = {
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
  statuses: Record<string, BannerStatusFields>;
  typography: TokenBinding<"typography">;
  titleTypography: TokenBinding<"typography">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
  iconSize: TokenBinding<"dimension">;
};

/**
 * Default icon per status, keyed by convention. `statusIcons` isn't a token
 * binding (Icon isn't a `ComponentContract` kind), so — like Collapsible's
 * indicator and DropdownButton's chevron — it's a build-time choice baked
 * directly into the generated component rather than a `recontent.config.ts`
 * binding. Unrecognized status keys fall back to "info".
 */
const DEFAULT_STATUS_ICONS: Record<string, string> = {
  info: "info",
  success: "check",
  warning: "alert",
  danger: "alert",
  error: "alert",
};

export const bannerComponent = defineRegistryComponent<BannerComponentOptions>()({
  id: "banner",
  name: "Banner",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    border: {
      kind: "token",
      type: "border",
      description: "Border applied around the banner.",
    },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the banner.",
    },
    statuses: {
      kind: "variants",
      description: "Banner's own palette, consumer-defined keys, drives the status prop.",
      fields: {
        color: { kind: "token", type: "color" },
        backgroundColor: { kind: "token", type: "color" },
        borderColor: { kind: "token", type: "color" },
        iconColor: { kind: "token", type: "color" },
        titleColor: { kind: "token", type: "color" },
      },
    },
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to the banner's body copy.",
    },
    titleTypography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to the banner's title.",
    },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the banner.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the banner.",
    },
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between the icon, content and actions.",
    },
    iconSize: {
      kind: "token",
      type: "dimension",
      description: "Size of the status icon.",
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "banner",
      "Banner",
      (_scales, _breakpoints, tokens, focusRingColor) =>
        generateBannerSources({
          border: tokens.border!,
          borderRadius: tokens.borderRadius!,
          typography: tokens.typography!,
          titleTypography: tokens.titleTypography!,
          horizontalSpacing: tokens.horizontalSpacing!,
          verticalSpacing: tokens.verticalSpacing!,
          gap: tokens.gap!,
          iconSize: tokens.iconSize!,
          defaultStatusIcons: DEFAULT_STATUS_ICONS,
          tokens,
          focusRingColor,
        }),
    ),
  },
});
