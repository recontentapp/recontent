import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { importName, requiredTokens } from "../shared.js";

export function generateBlockquoteSources({
  tokens,
}: {
  tokens: Record<string, TokenImport>;
}): ComponentSourceFiles {
  requiredTokens("Blockquote", tokens, [
    "color",
    "borderColor",
    "borderWidth",
    "marginBlockStart",
    "paddingInlineStart",
  ]);
  const valueImports = Object.values(tokens)
    .map(({ reference }) => importName(reference))
    .filter((name, index, imports) => imports.indexOf(name) === index)
    .join(", ");

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { ${valueImports} } from "../../tokens.css";

export const blockquoteRoot = style({
  margin: 0,
  marginBlockStart: ${tokens.marginBlockStart?.reference},
  borderInlineStart: \`\${${tokens.borderWidth?.reference}} solid \${${tokens.borderColor?.reference}}\`,
  paddingInlineStart: ${tokens.paddingInlineStart?.reference},
  fontStyle: "italic",
  color: ${tokens.color?.reference},
});
`,
    component: `import type { ComponentPropsWithoutRef } from "react";
import { blockquoteRoot } from "./Blockquote.gen.css";

export type BlockquoteProps = ComponentPropsWithoutRef<"blockquote">;

export function Blockquote({ className, ...props }: BlockquoteProps) {
  const classes = [blockquoteRoot, className].filter(Boolean).join(" ");

  return <blockquote data-slot="blockquote" {...props} className={classes} />;
}
`,
  };
}
