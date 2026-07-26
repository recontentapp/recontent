import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { importName } from "../shared.js";

export function generateBadgeSources({
  tokens,
}: {
  tokens: Record<string, TokenImport>;
}): ComponentSourceFiles {
  const required = [
    "gap",
    "height",
    "paddingInline",
    "borderRadius",
    "fontSize",
    "lineHeight",
    "fontWeight",
  ];
  const missing = required.filter((key) => !tokens[key]);
  if (missing.length > 0) {
    throw new Error(`Missing generated bindings for Badge: ${missing.join(", ")}.`);
  }

  const variants = Object.entries(tokens)
    .filter(([key]) => key.startsWith("variants."))
    .reduce<Record<string, Record<string, TokenImport>>>((result, [key, value]) => {
      const [, name, field] = key.split(".");
      if (!name || !field) return result;
      (result[name] ??= {})[field] = value;
      return result;
    }, {});
  const variantEntries = Object.entries(variants);
  if (variantEntries.length === 0) {
    throw new Error("Missing generated Badge variant bindings.");
  }
  for (const [name, fields] of variantEntries) {
    const missingFields = ["backgroundColor", "color", "borderColor"].filter(
      (field) => !fields[field],
    );
    if (missingFields.length > 0) {
      throw new Error(
        `Missing generated bindings for Badge variant "${name}": ${missingFields.join(", ")}.`,
      );
    }
  }

  const valueImports = Object.values(tokens)
    .map(({ reference }) => importName(reference))
    .filter((name, index, imports) => imports.indexOf(name) === index)
    .join(", ");
  const variantSource = variantEntries
    .map(
      ([name, fields]) => `  ${JSON.stringify(name)}: {
    backgroundColor: ${fields.backgroundColor?.reference},
    color: ${fields.color?.reference},
    border: \`1px solid \${${fields.borderColor?.reference}}\`,
  },`,
    )
    .join("\n");

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { ${valueImports} } from "../../tokens.css";

export const badgeRoot = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: ${tokens.gap?.reference},
  height: ${tokens.height?.reference},
  paddingInline: ${tokens.paddingInline?.reference},
  borderRadius: ${tokens.borderRadius?.reference},
  fontSize: ${tokens.fontSize?.reference},
  lineHeight: ${tokens.lineHeight?.reference},
  fontWeight: ${tokens.fontWeight?.reference},
  whiteSpace: "nowrap",
});

export const badgeVariant = styleVariants({
${variantSource}
});
`,
    component: `import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { badgeRoot, badgeVariant } from "./Badge.gen.css";

export type BadgeVariant = keyof typeof badgeVariant;

export type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  variant?: BadgeVariant;
  label: ReactNode;
  icon?: ReactNode;
};

export function Badge({
  variant,
  label,
  icon,
  className,
  ...props
}: BadgeProps) {
  const classes = [badgeRoot, variant && badgeVariant[variant], className]
    .filter(Boolean)
    .join(" ");

  return (
    <span data-slot="badge" data-variant={variant} {...props} className={classes}>
      {icon}
      {label}
    </span>
  );
}
`,
  };
}
