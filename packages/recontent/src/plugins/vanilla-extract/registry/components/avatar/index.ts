import type { ScaleBinding, TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateAvatarSources } from "./vanilla-extract.js";

export type AvatarComponentOptions = {
  sizes: ScaleBinding<"dimension">;
  color: TokenBinding<"color">;
  backgroundColor: TokenBinding<"color">;
  borderRadius: TokenBinding<"dimension">;
  typography: TokenBinding<"typography">;
};

export const avatarComponent = defineRegistryComponent<AvatarComponentOptions>()({
  id: "avatar",
  name: "Avatar",
  internalDependencies: ["render-element"],
  schema: {
    sizes: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the size prop.",
    },
    color: {
      kind: "token",
      type: "color",
      description: "Fallback text color.",
    },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Fallback background color.",
    },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: 'Corner radius applied when shape is "square".',
    },
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography used by the fallback text.",
    },
  },
  output: vanillaExtractComponentOutput(
    "avatar",
    "Avatar",
    (scales, _breakpoints, tokens) =>
      generateAvatarSources({
        sizes: scales.sizes!,
        color: tokens.color!,
        backgroundColor: tokens.backgroundColor!,
        borderRadius: tokens.borderRadius!,
        typography: tokens.typography!,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
