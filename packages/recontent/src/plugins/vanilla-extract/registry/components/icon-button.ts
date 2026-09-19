import type { ComponentSourceFiles, TokenImport } from "../types.js";
import {
  focusRingBlock,
  groupVariantTokens,
  hoverDisabledVariantStyleBody as variantStyleBody,
} from "./shared.js";
import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { vanillaExtractComponentOutput } from "./shared.js";

const VARIANT_FIELDS = [
  "backgroundColor",
  "color",
  "typography",
  "border",
  "hoverBackgroundColor",
  "hoverColor",
  "hoverBorder",
  "disabledBackgroundColor",
  "disabledColor",
  "disabledBorder",
] as const;

const SIZE_FIELDS = ["horizontalSpacing", "verticalSpacing", "iconSize"] as const;
function iconButtonSizeStyleBody(fields: Record<string, TokenImport>): string {
  return `{
      width: \`calc(${fields.iconSize!.reference} + 2 * ${fields.horizontalSpacing!.reference})\`,
      height: \`calc(${fields.iconSize!.reference} + 2 * ${fields.verticalSpacing!.reference})\`,
    }`;
}

function iconButtonSizeIconStyleBody(fields: Record<string, TokenImport>): string {
  return `{
      width: ${fields.iconSize!.reference},
      height: ${fields.iconSize!.reference},
    }`;
}

function generateIconButtonSources(bindings: {
  borderRadius: TokenImport;
  focusRingColor: TokenImport | undefined;
  tokens: Record<string, TokenImport>;
}): ComponentSourceFiles {
  const { borderRadius, focusRingColor, tokens } = bindings;
  const variants = groupVariantTokens(tokens, "variants", VARIANT_FIELDS);
  const sizes = groupVariantTokens(tokens, "sizes", SIZE_FIELDS);

  const variantNames = Object.keys(variants);
  const sizeNames = Object.keys(sizes);

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const iconButtonRoot = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  boxSizing: "border-box",
  cursor: "pointer",
  borderRadius: ${borderRadius.reference},
  ${focusRingBlock(focusRingColor)}
});

export const iconButtonLoading = style({
  cursor: "wait",
  opacity: 0.7,
});

export const iconButtonVariant = styleVariants({
${variantNames.map((name) => `  ${JSON.stringify(name)}: ${variantStyleBody(variants[name]!)},`).join("\n")}
});

export const iconButtonSize = styleVariants({
${sizeNames.map((name) => `  ${JSON.stringify(name)}: ${iconButtonSizeStyleBody(sizes[name]!)},`).join("\n")}
});

export const iconButtonIconSize = styleVariants({
${sizeNames.map((name) => `  ${JSON.stringify(name)}: ${iconButtonSizeIconStyleBody(sizes[name]!)},`).join("\n")}
});
`,
    component: `import { Button as BaseButton } from "@base-ui/react/button";
import {
  iconButtonIconSize,
  iconButtonLoading,
  iconButtonRoot,
  iconButtonSize,
  iconButtonVariant,
} from "./IconButton.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";
import type { MouseEventHandler } from "react";

export type IconButtonVariant = ${variantNames.map((n) => JSON.stringify(n)).join(" | ")};
export type IconButtonSize = ${sizeNames.map((n) => JSON.stringify(n)).join(" | ")};

export interface IconButtonProps extends CommonComponentProps {
  icon: IconType;
  /** Accessible name — mandatory, since there is no visible text. */
  label: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  render?: RenderProp<"button">;
}

export function IconButton({
  icon,
  label,
  type = "button",
  disabled = false,
  onClick,
  variant = ${JSON.stringify(variantNames[0] ?? "primary")},
  size = ${JSON.stringify(sizeNames[0] ?? "md")},
  loading = false,
  className,
  render,
  ...props
}: IconButtonProps) {
  const Icon = icons[icon];

  const classes = [
    iconButtonRoot,
    iconButtonVariant[variant],
    iconButtonSize[size],
    loading && iconButtonLoading,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <BaseButton
      {...props}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      render={render}
      className={classes}
      aria-label={label}
      data-slot="icon-button"
      data-loading={loading || undefined}
    >
      <Icon className={iconButtonIconSize[size]} aria-hidden="true" />
    </BaseButton>
  );
}
`,
  };
}

type IconButtonVariantFields = {
  backgroundColor: TokenBinding<"color">;
  color: TokenBinding<"color">;
  typography: TokenBinding<"typography">;
  border: TokenBinding<"border">;
  hoverBackgroundColor: TokenBinding<"color">;
  hoverColor: TokenBinding<"color">;
  hoverBorder: TokenBinding<"border">;
  disabledBackgroundColor: TokenBinding<"color">;
  disabledColor: TokenBinding<"color">;
  disabledBorder: TokenBinding<"border">;
};

type IconButtonSizeFields = {
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  iconSize: TokenBinding<"dimension">;
};

export type IconButtonComponentOptions = {
  borderRadius: TokenBinding<"dimension">;
  variants: Record<string, IconButtonVariantFields>;
  sizes: Record<string, IconButtonSizeFields>;
};

export const iconButtonComponent = defineRegistryComponent<IconButtonComponentOptions>()({
  id: "icon-button",
  name: "IconButton",
  internalDependencies: ["render-element"],
  schema: {
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the icon button.",
    },
    variants: {
      kind: "variants",
      description: "Consumer-defined visual variants, drives the variant prop.",
      fields: {
        backgroundColor: { kind: "token", type: "color" },
        color: { kind: "token", type: "color" },
        typography: { kind: "token", type: "typography" },
        border: { kind: "token", type: "border" },
        hoverBackgroundColor: { kind: "token", type: "color" },
        hoverColor: { kind: "token", type: "color" },
        hoverBorder: { kind: "token", type: "border" },
        disabledBackgroundColor: { kind: "token", type: "color" },
        disabledColor: { kind: "token", type: "color" },
        disabledBorder: { kind: "token", type: "border" },
      },
    },
    sizes: {
      kind: "variants",
      description: "Consumer-defined sizes, drives the size prop.",
      fields: {
        horizontalSpacing: { kind: "token", type: "dimension" },
        verticalSpacing: { kind: "token", type: "dimension" },
        iconSize: { kind: "token", type: "dimension" },
      },
    },
  },
  output: vanillaExtractComponentOutput(
    "icon-button",
    "IconButton",
    (_scales, _breakpoints, tokens, focusRingColor) =>
      generateIconButtonSources({
        borderRadius: tokens.borderRadius!,
        focusRingColor,
        tokens,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
