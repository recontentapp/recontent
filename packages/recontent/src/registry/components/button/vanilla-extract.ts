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
