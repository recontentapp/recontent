import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { focusRingBlock, groupVariantTokens } from "../shared.js";

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

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

function variantStyleBody(fields: Record<string, TokenImport>): string {
  return `{
      backgroundColor: ${fields.backgroundColor!.reference},
      color: ${fields.color!.reference},
      border: ${fields.border!.reference},
      ${typographyProps(fields.typography!.reference)},
      ":hover": {
        backgroundColor: ${fields.hoverBackgroundColor!.reference},
        color: ${fields.hoverColor!.reference},
        border: ${fields.hoverBorder!.reference},
      },
      ":disabled": {
        backgroundColor: ${fields.disabledBackgroundColor!.reference},
        color: ${fields.disabledColor!.reference},
        border: ${fields.disabledBorder!.reference},
        cursor: "not-allowed",
      },
    }`;
}

function sizeStyleBody(fields: Record<string, TokenImport>): string {
  return `{
      width: \`calc(${fields.iconSize!.reference} + 2 * ${fields.horizontalSpacing!.reference})\`,
      height: \`calc(${fields.iconSize!.reference} + 2 * ${fields.verticalSpacing!.reference})\`,
    }`;
}

function sizeIconStyleBody(fields: Record<string, TokenImport>): string {
  return `{
      width: ${fields.iconSize!.reference},
      height: ${fields.iconSize!.reference},
    }`;
}

export function generateIconButtonSources(bindings: {
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
${sizeNames.map((name) => `  ${JSON.stringify(name)}: ${sizeStyleBody(sizes[name]!)},`).join("\n")}
});

export const iconButtonIconSize = styleVariants({
${sizeNames.map((name) => `  ${JSON.stringify(name)}: ${sizeIconStyleBody(sizes[name]!)},`).join("\n")}
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
