import type { ComponentSourceFiles, TokenImport } from "../types.js";

function generateDividerSources(bindings: {
  border: TokenImport;
  borderRadius: TokenImport;
  color: TokenImport;
  spacing: TokenImport;
}): ComponentSourceFiles {
  const { border, borderRadius, color, spacing } = bindings;

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const dividerRoot = style({
  boxSizing: "border-box",
  flexShrink: 0,
  borderRadius: ${borderRadius.reference},
});

export const dividerOrientation = styleVariants({
  horizontal: {
    width: "100%",
    height: 0,
    borderTop: ${border.reference},
    borderColor: ${color.reference},
    marginTop: ${spacing.reference},
    marginBottom: ${spacing.reference},
  },
  vertical: {
    height: "100%",
    width: 0,
    alignSelf: "stretch",
    borderLeft: ${border.reference},
    borderColor: ${color.reference},
    marginLeft: ${spacing.reference},
    marginRight: ${spacing.reference},
  },
});
`,
    component: `import { Separator as BaseSeparator } from "@base-ui/react/separator";
import { dividerOrientation, dividerRoot } from "./Divider.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";

export interface DividerProps extends CommonComponentProps {
  orientation?: "horizontal" | "vertical";
  render?: RenderProp<"div">;
}

export function Divider({
  orientation = "horizontal",
  className,
  render,
  ...props
}: DividerProps) {
  const classes = [dividerRoot, dividerOrientation[orientation], className]
    .filter(Boolean)
    .join(" ");

  return (
    <BaseSeparator
      {...props}
      orientation={orientation}
      render={render}
      className={classes}
      data-slot="divider"
    />
  );
}
`,
  };
}

import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { vanillaExtractComponentOutput } from "./shared.js";

export type DividerComponentOptions = {
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
  color: TokenBinding<"color">;
  spacing: TokenBinding<"dimension">;
};

export const dividerComponent = defineRegistryComponent<DividerComponentOptions>()({
  id: "divider",
  name: "Divider",
  internalDependencies: ["render-element"],
  schema: {
    border: {
      kind: "token",
      type: "border",
      description: "Border applied along the divider's rule.",
    },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the divider.",
    },
    color: {
      kind: "token",
      type: "color",
      description: "Color of the divider's rule, overriding the border's own color.",
    },
    spacing: {
      kind: "token",
      type: "dimension",
      description: "Margin applied along the divider's cross axis.",
    },
  },
  output: vanillaExtractComponentOutput(
    "divider",
    "Divider",
    (_scales, _breakpoints, tokens) =>
      generateDividerSources({
        border: tokens.border!,
        borderRadius: tokens.borderRadius!,
        color: tokens.color!,
        spacing: tokens.spacing!,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
