import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { importName, requiredTokens } from "../shared.js";

export function generateKbdSources({
  tokens,
}: {
  tokens: Record<string, TokenImport>;
}): ComponentSourceFiles {
  requiredTokens("Kbd", tokens, [
    "height",
    "gap",
    "borderRadius",
    "borderWidth",
    "borderColor",
    "backgroundColor",
    "paddingInline",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "color",
  ]);
  const valueImports = Object.values(tokens)
    .map(({ reference }) => importName(reference))
    .filter((name, index, imports) => imports.indexOf(name) === index)
    .join(", ");

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { ${valueImports} } from "../../tokens.css";

export const kbdRoot = style({
  display: "inline-flex",
  width: "fit-content",
  height: ${tokens.height?.reference},
  alignItems: "center",
  justifyContent: "center",
  gap: ${tokens.gap?.reference},
  borderRadius: ${tokens.borderRadius?.reference},
  border: \`\${${tokens.borderWidth?.reference}} solid \${${tokens.borderColor?.reference}}\`,
  backgroundColor: ${tokens.backgroundColor?.reference},
  paddingInline: ${tokens.paddingInline?.reference},
  fontFamily: ${tokens.fontFamily?.reference},
  fontSize: ${tokens.fontSize?.reference},
  fontWeight: ${tokens.fontWeight?.reference},
  color: ${tokens.color?.reference},
  pointerEvents: "none",
  userSelect: "none",
});
`,
    component: `import type { ComponentPropsWithoutRef } from "react";
import { kbdRoot } from "./Kbd.gen.css";

export type KbdProps = ComponentPropsWithoutRef<"kbd">;

export function Kbd({ className, ...props }: KbdProps) {
  const classes = [kbdRoot, className].filter(Boolean).join(" ");

  return <kbd data-slot="kbd" {...props} className={classes} />;
}
`,
  };
}
