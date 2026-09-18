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

export function generateQuoteBlockSources(bindings: {
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
