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

export function generateLinkSources(bindings: {
  color: TokenImport;
  hoverColor: TokenImport;
  typography: TokenImport;
  visitedColor: TokenImport;
}): ComponentSourceFiles {
  const { color, hoverColor, typography, visitedColor } = bindings;

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const linkRoot = style({
  cursor: "pointer",
  color: ${color.reference},
  ${typographyProps(typography.reference)},
  ":hover": {
    color: ${hoverColor.reference},
  },
  ":visited": {
    color: ${visitedColor.reference},
  },
});

export const linkUnderline = styleVariants({
  always: { textDecorationLine: "underline" },
  hover: {
    textDecorationLine: "none",
    ":hover": { textDecorationLine: "underline" },
  },
  none: { textDecorationLine: "none" },
});
`,
    component: `import type { ComponentPropsWithoutRef, MouseEventHandler, ReactNode } from "react";
import { linkRoot, linkUnderline } from "./Link.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";

export interface LinkProps extends CommonComponentProps {
  href?: string;
  target?: string;
  rel?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  underline?: "always" | "hover" | "none";
  children?: ReactNode;
  render?: RenderProp<"a">;
}

export function Link({
  href,
  target,
  rel,
  onClick,
  underline = "always",
  className,
  render,
  children,
  ...props
}: LinkProps) {
  const classes = [linkRoot, linkUnderline[underline], className].filter(Boolean).join(" ");

  const rootProps: Record<string, unknown> = {
    ...props,
    href,
    target,
    rel,
    onClick,
    "data-slot": "link",
    className: classes,
    children,
  };

  return renderElement("a", render, rootProps as ComponentPropsWithoutRef<"a">);
}
`,
  };
}
