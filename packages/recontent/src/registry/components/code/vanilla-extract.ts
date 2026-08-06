import type { ComponentSourceFiles, TokenImport } from "../../types.js";

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n    ");
}

export function generateCodeSources(bindings: {
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
  ${typographyProps(typography.reference)},
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
