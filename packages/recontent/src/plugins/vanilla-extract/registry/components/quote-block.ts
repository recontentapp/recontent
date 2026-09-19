import type { ComponentSourceFiles, TokenImport } from "../types.js";

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n    ");
}

function generateQuoteBlockSources(bindings: {
  color: TokenImport;
  typography: TokenImport;
  citationColor: TokenImport;
  citationTypography: TokenImport;
  border: TokenImport;
  horizontalSpacing: TokenImport;
  verticalSpacing: TokenImport;
  gap: TokenImport;
}): ComponentSourceFiles {
  const {
    color,
    typography,
    citationColor,
    citationTypography,
    border,
    horizontalSpacing,
    verticalSpacing,
    gap,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const quoteBlockRoot = style({
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: ${gap.reference},
  boxSizing: "border-box",
  borderLeft: ${border.reference},
  paddingLeft: ${horizontalSpacing.reference},
  paddingRight: ${horizontalSpacing.reference},
  paddingTop: ${verticalSpacing.reference},
  paddingBottom: ${verticalSpacing.reference},
});

export const quoteBlockQuote = style({
  margin: 0,
  color: ${color.reference},
  ${typographyProps(typography.reference)},
});

export const quoteBlockCitation = style({
  margin: 0,
  color: ${citationColor.reference},
  ${typographyProps(citationTypography.reference)},
});
`,
    component: `import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { quoteBlockCitation, quoteBlockQuote, quoteBlockRoot } from "./QuoteBlock.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";

export interface QuoteBlockProps extends CommonComponentProps {
  citation?: string;
  citationHref?: string;
  children?: ReactNode;
  render?: RenderProp<"figure">;
}

export function QuoteBlock({
  citation,
  citationHref,
  className,
  render,
  children,
  ...props
}: QuoteBlockProps) {
  const classes = [quoteBlockRoot, className].filter(Boolean).join(" ");

  const content = (
    <>
      <blockquote className={quoteBlockQuote}>{children}</blockquote>
      {citation !== undefined && (
        <figcaption className={quoteBlockCitation}>
          {citationHref ? <a href={citationHref}>{citation}</a> : citation}
        </figcaption>
      )}
    </>
  );

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "quote-block",
    className: classes,
    children: content,
  };

  return renderElement("figure", render, rootProps as ComponentPropsWithoutRef<"figure">);
}
`,
  };
}

import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { vanillaExtractComponentOutput } from "./shared.js";

export type QuoteBlockComponentOptions = {
  color: TokenBinding<"color">;
  typography: TokenBinding<"typography">;
  citationColor: TokenBinding<"color">;
  citationTypography: TokenBinding<"typography">;
  border: TokenBinding<"border">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
};

export const quoteBlockComponent = defineRegistryComponent<QuoteBlockComponentOptions>()({
  id: "quote-block",
  name: "QuoteBlock",
  internalDependencies: ["render-element"],
  schema: {
    color: {
      kind: "token",
      type: "color",
      description: "Text color for the quote.",
    },
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography used by the quote.",
    },
    citationColor: {
      kind: "token",
      type: "color",
      description: "Text color for the citation.",
    },
    citationTypography: {
      kind: "token",
      type: "typography",
      description: "Typography used by the citation.",
    },
    border: {
      kind: "token",
      type: "border",
      description: "Leading rule shown along the quote's left edge.",
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
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between the quote and its citation.",
    },
  },
  output: vanillaExtractComponentOutput(
    "quote-block",
    "QuoteBlock",
    (_scales, _breakpoints, tokens) =>
      generateQuoteBlockSources({
        color: tokens.color!,
        typography: tokens.typography!,
        citationColor: tokens.citationColor!,
        citationTypography: tokens.citationTypography!,
        border: tokens.border!,
        horizontalSpacing: tokens.horizontalSpacing!,
        verticalSpacing: tokens.verticalSpacing!,
        gap: tokens.gap!,
      }),
  ),
});
