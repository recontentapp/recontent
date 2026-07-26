import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { importName, requiredTokens } from "../shared.js";

export function generateSectionSources({
  tokens,
}: {
  tokens: Record<string, TokenImport>;
}): ComponentSourceFiles {
  requiredTokens("Section", tokens, [
    "backgroundColor",
    "color",
    "paddingBlock",
    "paddingInline",
    "gap",
  ]);
  const valueImports = Object.values(tokens)
    .map(({ reference }) => importName(reference))
    .filter((name, index, imports) => imports.indexOf(name) === index)
    .join(", ");

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { ${valueImports} } from "../../tokens.css";

export const sectionRoot = style({
  display: "flex",
  flexDirection: "column",
  gap: ${tokens.gap?.reference},
  paddingBlock: ${tokens.paddingBlock?.reference},
  paddingInline: ${tokens.paddingInline?.reference},
  backgroundColor: ${tokens.backgroundColor?.reference},
  color: ${tokens.color?.reference},
});
`,
    component: `import type { ComponentPropsWithoutRef } from "react";
import { sectionRoot } from "./Section.gen.css";

export type SectionProps = ComponentPropsWithoutRef<"section">;

export function Section({ className, ...props }: SectionProps) {
  const classes = [sectionRoot, className].filter(Boolean).join(" ");

  return <section data-slot="section" {...props} className={classes} />;
}
`,
  };
}
