import type { ComponentSourceFiles, TokenImport } from "../types.js";

export function importName(reference: string): string {
  const [name] = reference.split(".");
  if (!name) {
    throw new Error(`Invalid token variable reference: ${reference}`);
  }
  return name;
}

export function requiredTokens(
  component: string,
  tokens: Record<string, TokenImport>,
  keys: readonly string[],
): void {
  const missing = keys.filter((key) => !tokens[key]);
  if (missing.length > 0) {
    throw new Error(`Missing generated bindings for ${component}: ${missing.join(", ")}.`);
  }
}

export function generateSupportingTextSources(
  component: "Citation" | "Timestamp",
  element: "cite" | "time",
  tokens: Record<string, TokenImport>,
): ComponentSourceFiles {
  requiredTokens(component, tokens, ["color", "fontSize", "lineHeight", "fontWeight"]);
  const valueImports = Object.values(tokens)
    .map(({ reference }) => importName(reference))
    .filter((name, index, imports) => imports.indexOf(name) === index)
    .join(", ");
  const identifier = component === "Citation" ? "citation" : "timestamp";
  const fontStyle = component === "Citation" ? '\n  fontStyle: "italic",' : "";

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { ${valueImports} } from "../../tokens.css";

export const ${identifier}Root = style({${fontStyle}
  fontSize: ${tokens.fontSize?.reference},
  lineHeight: ${tokens.lineHeight?.reference},
  fontWeight: ${tokens.fontWeight?.reference},
  color: ${tokens.color?.reference},
});
`,
    component: `import type { ComponentPropsWithoutRef } from "react";
import { ${identifier}Root } from "./${component}.gen.css";

export type ${component}Props = ComponentPropsWithoutRef<"${element}">;

export function ${component}({ className, ...props }: ${component}Props) {
  const classes = [${identifier}Root, className].filter(Boolean).join(" ");

  return <${element} data-slot="${identifier}" {...props} className={classes} />;
}
`,
  };
}
