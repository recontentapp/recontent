import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { importName, requiredTokens } from "../shared.js";

export function generateCardSources({
  tokens,
}: {
  tokens: Record<string, TokenImport>;
}): ComponentSourceFiles {
  requiredTokens("Card", tokens, [
    "gap",
    "borderRadius",
    "borderWidth",
    "borderColor",
    "backgroundColor",
    "color",
    "padding",
    "headerGap",
    "titleFontSize",
    "titleFontWeight",
    "titleLineHeight",
    "descriptionFontSize",
    "descriptionColor",
  ]);
  const valueImports = Object.values(tokens)
    .map(({ reference }) => importName(reference))
    .filter((name, index, imports) => imports.indexOf(name) === index)
    .join(", ");

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { ${valueImports} } from "../../tokens.css";

export const cardRoot = style({
  display: "flex",
  flexDirection: "column",
  gap: ${tokens.gap?.reference},
  borderRadius: ${tokens.borderRadius?.reference},
  border: \`\${${tokens.borderWidth?.reference}} solid \${${tokens.borderColor?.reference}}\`,
  backgroundColor: ${tokens.backgroundColor?.reference},
  color: ${tokens.color?.reference},
});

export const cardHeader = style({
  display: "flex",
  flexDirection: "column",
  gap: ${tokens.headerGap?.reference},
  padding: ${tokens.padding?.reference},
});

export const cardTitle = style({
  fontSize: ${tokens.titleFontSize?.reference},
  fontWeight: ${tokens.titleFontWeight?.reference},
  lineHeight: ${tokens.titleLineHeight?.reference},
});

export const cardDescription = style({
  fontSize: ${tokens.descriptionFontSize?.reference},
  color: ${tokens.descriptionColor?.reference},
});

export const cardContent = style({
  paddingInline: ${tokens.padding?.reference},
});

export const cardFooter = style({
  display: "flex",
  alignItems: "center",
  padding: ${tokens.padding?.reference},
  paddingTop: 0,
});
`,
    component: `import type { ComponentPropsWithoutRef } from "react";
import {
  cardContent,
  cardDescription,
  cardFooter,
  cardHeader,
  cardRoot,
  cardTitle,
} from "./Card.gen.css";

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type CardProps = ComponentPropsWithoutRef<"div">;
export type CardHeaderProps = ComponentPropsWithoutRef<"div">;
export type CardTitleProps = ComponentPropsWithoutRef<"div">;
export type CardDescriptionProps = ComponentPropsWithoutRef<"div">;
export type CardContentProps = ComponentPropsWithoutRef<"div">;
export type CardFooterProps = ComponentPropsWithoutRef<"div">;

export function Card({ className, ...props }: CardProps) {
  return <div data-slot="card" {...props} className={classes(cardRoot, className)} />;
}

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return <div data-slot="card-header" {...props} className={classes(cardHeader, className)} />;
}

export function CardTitle({ className, ...props }: CardTitleProps) {
  return <div data-slot="card-title" {...props} className={classes(cardTitle, className)} />;
}

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return <div data-slot="card-description" {...props} className={classes(cardDescription, className)} />;
}

export function CardContent({ className, ...props }: CardContentProps) {
  return <div data-slot="card-content" {...props} className={classes(cardContent, className)} />;
}

export function CardFooter({ className, ...props }: CardFooterProps) {
  return <div data-slot="card-footer" {...props} className={classes(cardFooter, className)} />;
}
`,
  };
}
