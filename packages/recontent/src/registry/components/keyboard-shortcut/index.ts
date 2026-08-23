import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateKeyboardShortcutSources } from "./vanilla-extract.js";

export type KeyboardShortcutComponentOptions = {
  color: TokenBinding<"color">;
  backgroundColor: TokenBinding<"color">;
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
  typography: TokenBinding<"typography">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
};

export const keyboardShortcutComponent =
  defineRegistryComponent<KeyboardShortcutComponentOptions>()({
    id: "keyboard-shortcut",
    name: "KeyboardShortcut",
    internalDependencies: ["render-element"],
    schema: {
      color: {
        kind: "token",
        type: "color",
        description: "Text color for each key.",
      },
      backgroundColor: {
        kind: "token",
        type: "color",
        description: "Background color for each key.",
      },
      border: {
        kind: "token",
        type: "border",
        description: "Border applied to each key.",
      },
      borderRadius: {
        kind: "token",
        type: "dimension",
        description: "Corner radius applied to each key.",
      },
      typography: {
        kind: "token",
        type: "typography",
        description: "Typography used by each key.",
      },
      horizontalSpacing: {
        kind: "token",
        type: "dimension",
        description: "Left/right padding for each key.",
      },
      verticalSpacing: {
        kind: "token",
        type: "dimension",
        description: "Top/bottom padding for each key.",
      },
      gap: {
        kind: "token",
        type: "dimension",
        description: "Space between individual keys.",
      },
    },
    outputs: {
      "vanilla-extract": vanillaExtractComponentOutput(
        "keyboard-shortcut",
        "KeyboardShortcut",
        (_scales, _breakpoints, tokens) =>
          generateKeyboardShortcutSources({
            color: tokens.color!,
            backgroundColor: tokens.backgroundColor!,
            border: tokens.border!,
            borderRadius: tokens.borderRadius!,
            typography: tokens.typography!,
            horizontalSpacing: tokens.horizontalSpacing!,
            verticalSpacing: tokens.verticalSpacing!,
            gap: tokens.gap!,
          }),
      ),
    },
  });
