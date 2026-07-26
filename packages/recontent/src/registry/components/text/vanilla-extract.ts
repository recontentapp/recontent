import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { importName, requiredTokens } from "../shared.js";

export function generateTextSources({
  tokens,
}: {
  tokens: Record<string, TokenImport>;
}): ComponentSourceFiles {
  requiredTokens("Text", tokens, ["fontFamily", "fontSize", "lineHeight", "fontWeight", "color"]);
  const valueImports = Object.values(tokens)
    .map(({ reference }) => importName(reference))
    .filter((name, index, imports) => imports.indexOf(name) === index)
    .join(", ");

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { ${valueImports} } from "../../tokens.css";

export const textRoot = style({
  margin: 0,
  fontFamily: ${tokens.fontFamily?.reference},
  fontSize: ${tokens.fontSize?.reference},
  lineHeight: ${tokens.lineHeight?.reference},
  fontWeight: ${tokens.fontWeight?.reference},
  color: ${tokens.color?.reference},
});
`,
    component: `import type { ComponentPropsWithoutRef } from "react";
import { textRoot } from "./Text.gen.css";

export type TextElement = "p" | "span" | "div";

export type TextProps = ComponentPropsWithoutRef<"p"> & {
  as?: TextElement;
};

export function Text({ as: Tag = "p", className, ...props }: TextProps) {
  const classes = [textRoot, className].filter(Boolean).join(" ");

  return <Tag data-slot="text" {...props} className={classes} />;
}
`,
  };
}
