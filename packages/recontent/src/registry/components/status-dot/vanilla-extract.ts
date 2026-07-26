import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { importName, requiredTokens } from "../shared.js";

export function generateStatusDotSources({
  tokens,
}: {
  tokens: Record<string, TokenImport>;
}): ComponentSourceFiles {
  requiredTokens("StatusDot", tokens, ["size"]);

  const variants = Object.entries(tokens)
    .filter(([key]) => key.startsWith("variants."))
    .reduce<Record<string, TokenImport>>((result, [key, value]) => {
      const [, name, field] = key.split(".");
      if (name && field === "color") result[name] = value;
      return result;
    }, {});
  const variantEntries = Object.entries(variants);
  if (variantEntries.length === 0) {
    throw new Error("Missing generated StatusDot variant bindings.");
  }

  const valueImports = Object.values(tokens)
    .map(({ reference }) => importName(reference))
    .filter((name, index, imports) => imports.indexOf(name) === index)
    .join(", ");
  const variantSource = variantEntries
    .map(
      ([name, token]) => `  ${JSON.stringify(name)}: {
    backgroundColor: ${token.reference},
  },`,
    )
    .join("\n");

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { ${valueImports} } from "../../tokens.css";

export const statusDotRoot = style({
  display: "inline-flex",
  flexShrink: 0,
  width: ${tokens.size?.reference},
  height: ${tokens.size?.reference},
  borderRadius: "50%",
});

export const statusDotVariant = styleVariants({
${variantSource}
});
`,
    component: `import type { ComponentPropsWithoutRef } from "react";
import { statusDotRoot, statusDotVariant } from "./StatusDot.gen.css";

export type StatusDotStatus = keyof typeof statusDotVariant;

export type StatusDotProps = ComponentPropsWithoutRef<"span"> & {
  status: StatusDotStatus;
};

export function StatusDot({ status, className, ...props }: StatusDotProps) {
  const classes = [
    statusDotRoot,
    statusDotVariant[status],
    className,
  ].filter(Boolean).join(" ");

  return (
    <span data-slot="status-dot" data-status={status} {...props} className={classes} />
  );
}
`,
  };
}
