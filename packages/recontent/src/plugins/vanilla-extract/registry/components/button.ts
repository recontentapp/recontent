import type { ComponentSourceFiles, TokenImport } from "../types.js";
import { focusRingBlock, groupVariantTokens } from "./shared.js";

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

const SIZE_FIELDS = ["horizontalSpacing", "verticalSpacing", "typography", "gap"] as const;

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
      transitionProperty: "background-color, color, border-color",
      transitionDuration: "150ms",
      transitionTimingFunction: "ease",
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
      paddingLeft: ${fields.horizontalSpacing!.reference},
      paddingRight: ${fields.horizontalSpacing!.reference},
      paddingTop: ${fields.verticalSpacing!.reference},
      paddingBottom: ${fields.verticalSpacing!.reference},
      gap: ${fields.gap!.reference},
      ${typographyProps(fields.typography!.reference)},
    }`;
}

export function generateButtonSources(bindings: {
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

export const buttonRoot = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  borderRadius: ${borderRadius.reference},
  ${focusRingBlock(focusRingColor)}
});

export const buttonLoading = style({
  cursor: "wait",
  opacity: 0.7,
});

export const buttonVariant = styleVariants({
${variantNames.map((name) => `  ${JSON.stringify(name)}: ${variantStyleBody(variants[name]!)},`).join("\n")}
});

export const buttonSize = styleVariants({
${sizeNames.map((name) => `  ${JSON.stringify(name)}: ${sizeStyleBody(sizes[name]!)},`).join("\n")}
});
`,
    component: `import type { CSSProperties, ReactElement, ReactNode, MouseEventHandler } from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { buttonLoading, buttonRoot, buttonSize, buttonVariant } from "./Button.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";

export type ButtonVariant = ${variantNames.map((n) => JSON.stringify(n)).join(" | ")};
export type ButtonSize = ${sizeNames.map((n) => JSON.stringify(n)).join(" | ")};

/** Structural sizing, not covered by tokens. */
export type Width = "100%" | "auto" | number | (string & {});

export interface ButtonProps extends CommonComponentProps {
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  startContent?: ReactElement;
  endContent?: ReactElement;
  loading?: boolean;
  disabled?: boolean;
  name?: string;
  value?: string;
  width?: Width;
  children?: ReactNode;
  render?: RenderProp<"button">;
}

export function Button({
  type = "button",
  onClick,
  variant = ${JSON.stringify(variantNames[0] ?? "primary")},
  size = ${JSON.stringify(sizeNames[0] ?? "md")},
  startContent,
  endContent,
  loading = false,
  disabled = false,
  name,
  value,
  width,
  className,
  render,
  children,
  ...props
}: ButtonProps) {
  const classes = [
    buttonRoot,
    buttonVariant[variant],
    buttonSize[size],
    loading && buttonLoading,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties = { width };

  return (
    <BaseButton
      {...props}
      type={type}
      onClick={onClick}
      name={name}
      value={value}
      disabled={disabled || loading}
      render={render}
      className={classes}
      style={style}
      data-slot="button"
      data-loading={loading || undefined}
    >
      {startContent}
      {children}
      {endContent}
    </BaseButton>
  );
}
`,
  };
}

import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { vanillaExtractComponentOutput } from "./shared.js";

type ButtonVariantFields = {
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

type ButtonSizeFields = {
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  typography: TokenBinding<"typography">;
  gap: TokenBinding<"dimension">;
};

export type ButtonComponentOptions = {
  borderRadius: TokenBinding<"dimension">;
  variants: Record<string, ButtonVariantFields>;
  sizes: Record<string, ButtonSizeFields>;
};

export const buttonComponent = defineRegistryComponent<ButtonComponentOptions>()({
  id: "button",
  name: "Button",
  internalDependencies: ["render-element"],
  schema: {
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the button.",
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
        typography: { kind: "token", type: "typography" },
        gap: { kind: "token", type: "dimension" },
      },
    },
  },
  output: vanillaExtractComponentOutput(
    "button",
    "Button",
    (_scales, _breakpoints, tokens, focusRingColor) =>
      generateButtonSources({
        borderRadius: tokens.borderRadius!,
        focusRingColor,
        tokens,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
