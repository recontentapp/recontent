import type { ComponentPropsWithoutRef, ReactNode } from "react";
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
