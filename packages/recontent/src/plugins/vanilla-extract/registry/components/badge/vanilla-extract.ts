import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { groupVariantTokens } from "../shared.js";

const STATUS_FIELDS = ["color", "backgroundColor", "border"] as const;
const SIZE_FIELDS = [
  "typography",
  "horizontalSpacing",
  "verticalSpacing",
  "gap",
  "iconSize",
] as const;

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

function statusStyleBody(fields: Record<string, TokenImport>): string {
  return `{
      color: ${fields.color!.reference},
      backgroundColor: ${fields.backgroundColor!.reference},
      border: ${fields.border!.reference},
    }`;
}

function sizeStyleBody(fields: Record<string, TokenImport>): string {
  return `{
      paddingLeft: ${fields.horizontalSpacing!.reference},
      paddingRight: ${fields.horizontalSpacing!.reference},
      paddingTop: ${fields.verticalSpacing!.reference},
      paddingBottom: ${fields.verticalSpacing!.reference},
      gap: ${fields.gap!.reference},
      ${typographyProps(fields.typography!.reference)},
    }`;
}

function sizeIconStyleBody(fields: Record<string, TokenImport>): string {
  return `{ width: ${fields.iconSize!.reference}, height: ${fields.iconSize!.reference} }`;
}

export function generateBadgeSources(bindings: {
  borderRadius: TokenImport;
  tokens: Record<string, TokenImport>;
}): ComponentSourceFiles {
  const { borderRadius, tokens } = bindings;
  const statuses = groupVariantTokens(tokens, "statuses", STATUS_FIELDS);
  const sizes = groupVariantTokens(tokens, "sizes", SIZE_FIELDS);

  const statusNames = Object.keys(statuses);
  const sizeNames = Object.keys(sizes);

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const badgeRoot = style({
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  borderRadius: ${borderRadius.reference},
  whiteSpace: "nowrap",
});

export const badgeVariant = styleVariants({
${statusNames.map((name) => `  ${JSON.stringify(name)}: ${statusStyleBody(statuses[name]!)},`).join("\n")}
});

export const badgeSize = styleVariants({
${sizeNames.map((name) => `  ${JSON.stringify(name)}: ${sizeStyleBody(sizes[name]!)},`).join("\n")}
});

export const badgeIconSize = styleVariants({
${sizeNames.map((name) => `  ${JSON.stringify(name)}: ${sizeIconStyleBody(sizes[name]!)},`).join("\n")}
});
`,
    component: `import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { badgeIconSize, badgeRoot, badgeSize, badgeVariant } from "./Badge.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";

export type BadgeStatusToken = ${statusNames.map((n) => JSON.stringify(n)).join(" | ")};
export type BadgeSize = ${sizeNames.map((n) => JSON.stringify(n)).join(" | ")};

export interface BadgeProps extends CommonComponentProps {
  variant?: BadgeStatusToken;
  size?: BadgeSize;
  icon?: IconType;
  children?: ReactNode;
  render?: RenderProp<"span">;
}

export function Badge({
  variant = ${JSON.stringify(statusNames[0] ?? "info")},
  size = ${JSON.stringify(sizeNames[0] ?? "sm")},
  icon,
  className,
  render,
  children,
  ...props
}: BadgeProps) {
  const Icon = icon ? icons[icon] : undefined;

  const classes = [badgeRoot, badgeVariant[variant], badgeSize[size], className]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {Icon && <Icon className={badgeIconSize[size]} aria-hidden="true" />}
      {children}
    </>
  );

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "badge",
    className: classes,
    children: content,
  };

  return renderElement("span", render, rootProps as ComponentPropsWithoutRef<"span">);
}
`,
  };
}
