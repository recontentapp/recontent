import type { ComponentSourceFiles, TokenImport } from "../types.js";
import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { typographyProps, vanillaExtractComponentOutput } from "./shared.js";
function generateCodeSources(bindings: {
  color: TokenImport;
  backgroundColor: TokenImport;
  border: TokenImport;
  borderRadius: TokenImport;
  typography: TokenImport;
  horizontalSpacing: TokenImport;
  verticalSpacing: TokenImport;
}): ComponentSourceFiles {
  const {
    color,
    backgroundColor,
    border,
    borderRadius,
    typography,
    horizontalSpacing,
    verticalSpacing,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const codeRoot = style({
  display: "inline-block",
  boxSizing: "border-box",
  color: ${color.reference},
  backgroundColor: ${backgroundColor.reference},
  border: ${border.reference},
  borderRadius: ${borderRadius.reference},
  paddingLeft: ${horizontalSpacing.reference},
  paddingRight: ${horizontalSpacing.reference},
  paddingTop: ${verticalSpacing.reference},
  paddingBottom: ${verticalSpacing.reference},
  ${typographyProps(typography.reference, "    ")},
});
`,
    component: `import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { codeRoot } from "./Code.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";

export interface CodeProps extends CommonComponentProps {
  children?: ReactNode;
  render?: RenderProp<"code">;
}

export function Code({ className, render, children, ...props }: CodeProps) {
  const classes = [codeRoot, className].filter(Boolean).join(" ");

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "code",
    className: classes,
    children,
  };

  return renderElement("code", render, rootProps as ComponentPropsWithoutRef<"code">);
}
`,
  };
}

export type CodeComponentOptions = {
  color: TokenBinding<"color">;
  backgroundColor: TokenBinding<"color">;
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
  typography: TokenBinding<"typography">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
};

export const codeComponent = defineRegistryComponent<CodeComponentOptions>()({
  id: "code",
  name: "Code",
  internalDependencies: ["render-element"],
  schema: {
    color: {
      kind: "token",
      type: "color",
      description: "Text color for the code snippet.",
    },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color for the code snippet.",
    },
    border: {
      kind: "token",
      type: "border",
      description: "Border applied around the code snippet.",
    },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the code snippet.",
    },
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography used by the code font.",
    },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding.",
    },
  },
  output: vanillaExtractComponentOutput("code", "Code", (_scales, _breakpoints, tokens) =>
    generateCodeSources({
      color: tokens.color!,
      backgroundColor: tokens.backgroundColor!,
      border: tokens.border!,
      borderRadius: tokens.borderRadius!,
      typography: tokens.typography!,
      horizontalSpacing: tokens.horizontalSpacing!,
      verticalSpacing: tokens.verticalSpacing!,
    }),
  ),
});
