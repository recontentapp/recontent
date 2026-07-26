import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { importName, requiredTokens } from "../shared.js";

export function generateHeadingSources({
  tokens,
}: {
  tokens: Record<string, TokenImport>;
}): ComponentSourceFiles {
  requiredTokens("Heading", tokens, ["fontFamily"]);
  const variants = Object.entries(tokens)
    .filter(([key]) => key.startsWith("levels."))
    .reduce<Record<string, Record<string, TokenImport>>>((result, [key, value]) => {
      const [, level, field] = key.split(".");
      if (!level || !field) return result;
      (result[level] ??= {})[field] = value;
      return result;
    }, {});
  const levels = ["1", "2", "3", "4", "5", "6"];
  const missing = levels.filter((level) =>
    ["fontSize", "lineHeight", "fontWeight", "color"].some((field) => !variants[level]?.[field]),
  );
  if (missing.length > 0) {
    throw new Error(`Missing generated bindings for Heading levels: ${missing.join(", ")}.`);
  }

  const valueImports = Object.values(tokens)
    .map(({ reference }) => importName(reference))
    .filter((name, index, imports) => imports.indexOf(name) === index)
    .join(", ");
  const levelSource = levels
    .map(
      (level) => `  ${JSON.stringify(level)}: {
    fontSize: ${variants[level]?.fontSize.reference},
    lineHeight: ${variants[level]?.lineHeight.reference},
    fontWeight: ${variants[level]?.fontWeight.reference},
    color: ${variants[level]?.color.reference},
  },`,
    )
    .join("\n");

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { ${valueImports} } from "../../tokens.css";

export const headingRoot = style({
  margin: 0,
  fontFamily: ${tokens.fontFamily?.reference},
});

export const headingLevel = styleVariants({
${levelSource}
});
`,
    component: `import type { ComponentPropsWithoutRef } from "react";
import { headingLevel, headingRoot } from "./Heading.gen.css";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type HeadingProps = ComponentPropsWithoutRef<"h1"> & {
  level?: HeadingLevel;
};

export function Heading({ level = 2, className, ...props }: HeadingProps) {
  const Tag = \`h\${level}\` as "h1";
  const classes = [
    headingRoot,
    headingLevel[level],
    className,
  ].filter(Boolean).join(" ");

  return <Tag data-slot="heading" data-level={level} {...props} className={classes} />;
}
`,
  };
}
