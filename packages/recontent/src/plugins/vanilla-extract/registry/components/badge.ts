import type { ComponentSourceFiles, TokenImport } from "../types.js";
import { groupVariantTokens } from "./shared.js";

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

import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { vanillaExtractComponentOutput } from "./shared.js";

type BadgeStatusFields = {
  color: TokenBinding<"color">;
  backgroundColor: TokenBinding<"color">;
  border: TokenBinding<"border">;
};

type BadgeSizeFields = {
  typography: TokenBinding<"typography">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
  iconSize: TokenBinding<"dimension">;
};

export type BadgeComponentOptions = {
  borderRadius: TokenBinding<"dimension">;
  statuses: Record<string, BadgeStatusFields>;
  sizes: Record<string, BadgeSizeFields>;
};

export const badgeComponent = defineRegistryComponent<BadgeComponentOptions>()({
  id: "badge",
  name: "Badge",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the badge.",
    },
    statuses: {
      kind: "variants",
      description: "Badge's own palette, consumer-defined keys, drives the variant prop.",
      fields: {
        color: { kind: "token", type: "color" },
        backgroundColor: { kind: "token", type: "color" },
        border: { kind: "token", type: "border" },
      },
    },
    sizes: {
      kind: "variants",
      description: "Consumer-defined sizes, drives the size prop.",
      fields: {
        typography: { kind: "token", type: "typography" },
        horizontalSpacing: { kind: "token", type: "dimension" },
        verticalSpacing: { kind: "token", type: "dimension" },
        gap: { kind: "token", type: "dimension" },
        iconSize: { kind: "token", type: "dimension" },
      },
    },
  },
  output: vanillaExtractComponentOutput("badge", "Badge", (_scales, _breakpoints, tokens) =>
    generateBadgeSources({
      borderRadius: tokens.borderRadius!,
      tokens,
    }),
  ),
});
