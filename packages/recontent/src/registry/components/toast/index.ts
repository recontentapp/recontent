import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateToastSources } from "./vanilla-extract.js";

type ToastStatusFields = {
  color: TokenBinding<"color">;
  backgroundColor: TokenBinding<"color">;
  borderColor: TokenBinding<"color">;
  iconColor: TokenBinding<"color">;
  titleColor: TokenBinding<"color">;
};

export type ToastComponentOptions = {
  statuses: Record<string, ToastStatusFields>;
  backgroundColor: TokenBinding<"color">;
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
  shadow: TokenBinding<"shadow">;
  titleTypography: TokenBinding<"typography">;
  descriptionTypography: TokenBinding<"typography">;
  descriptionColor: TokenBinding<"color">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
  stackGap: TokenBinding<"dimension">;
  offset: TokenBinding<"dimension">;
  width: TokenBinding<"dimension">;
  iconSize: TokenBinding<"dimension">;
  transition: TokenBinding<"transition">;
};

/**
 * Default icon per status, keyed by convention. `statusIcons` isn't a token
 * binding (Icon isn't a `ComponentContract` kind), so — like Banner's status
 * icons — it's a build-time choice baked directly into the generated
 * component. `closeIcon` is likewise baked. Unrecognized status keys fall
 * back to "info".
 */
const DEFAULT_STATUS_ICONS: Record<string, string> = {
  info: "info",
  success: "check",
  warning: "alert",
  danger: "alert",
  error: "alert",
};
const CLOSE_ICON = "close";

export const toastComponent = defineRegistryComponent<ToastComponentOptions>()({
  id: "toast",
  name: "Toast",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    statuses: {
      kind: "variants",
      description: "Toast's own palette, consumer-defined keys, drives the status prop.",
      fields: {
        color: { kind: "token", type: "color" },
        backgroundColor: { kind: "token", type: "color" },
        borderColor: { kind: "token", type: "color" },
        iconColor: { kind: "token", type: "color" },
        titleColor: { kind: "token", type: "color" },
      },
    },
    backgroundColor: { kind: "token", type: "color", description: "Background color of a toast." },
    border: { kind: "token", type: "border", description: "Border applied around a toast." },
    borderRadius: { kind: "token", type: "dimension", description: "Corner radius applied to a toast." },
    shadow: { kind: "token", type: "shadow", description: "Shadow applied to a toast." },
    titleTypography: { kind: "token", type: "typography", description: "Typography of a toast's title." },
    descriptionTypography: {
      kind: "token",
      type: "typography",
      description: "Typography of a toast's description.",
    },
    descriptionColor: { kind: "token", type: "color", description: "Text color of a toast's description." },
    horizontalSpacing: { kind: "token", type: "dimension", description: "Left/right padding of a toast." },
    verticalSpacing: { kind: "token", type: "dimension", description: "Top/bottom padding of a toast." },
    gap: { kind: "token", type: "dimension", description: "Space between the icon, content and action." },
    stackGap: { kind: "token", type: "dimension", description: "Space between stacked toasts." },
    offset: { kind: "token", type: "dimension", description: "Distance from the viewport edge." },
    width: { kind: "token", type: "dimension", description: "Width of a toast." },
    iconSize: { kind: "token", type: "dimension", description: "Size of the status/close icons." },
    transition: {
      kind: "token",
      type: "transition",
      description: "Transition used to enter/exit.",
    },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "toast",
      "Toast",
      (_scales, _breakpoints, tokens, focusRingColor) =>
        generateToastSources({
          backgroundColor: tokens.backgroundColor!,
          border: tokens.border!,
          borderRadius: tokens.borderRadius!,
          shadow: tokens.shadow!,
          titleTypography: tokens.titleTypography!,
          descriptionTypography: tokens.descriptionTypography!,
          descriptionColor: tokens.descriptionColor!,
          horizontalSpacing: tokens.horizontalSpacing!,
          verticalSpacing: tokens.verticalSpacing!,
          gap: tokens.gap!,
          stackGap: tokens.stackGap!,
          offset: tokens.offset!,
          width: tokens.width!,
          iconSize: tokens.iconSize!,
          transition: tokens.transition!,
          defaultStatusIcons: DEFAULT_STATUS_ICONS,
          closeIcon: CLOSE_ICON,
          tokens,
          focusRingColor,
        }),
      { "@base-ui/react": "^1.0.0" },
    ),
  },
});
