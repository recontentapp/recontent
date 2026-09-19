import type { ComponentSourceFiles, TokenImport } from "../types.js";

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

function generateTextInputSources(bindings: {
  borderRadius: TokenImport;
  border: TokenImport;
  backgroundColor: TokenImport;
  color: TokenImport;
  typography: TokenImport;
  placeholderColor: TokenImport;
  horizontalSpacing: TokenImport;
  verticalSpacing: TokenImport;
  gap: TokenImport;
  hoverBorderColor: TokenImport;
  focusBorderColor: TokenImport;
  focusRingColor: TokenImport | undefined;
  invalidBorderColor: TokenImport;
  disabledBackgroundColor: TokenImport;
  disabledColor: TokenImport;
  readOnlyBackgroundColor: TokenImport;
  iconColor: TokenImport;
  iconSize: TokenImport;
  affixColor: TokenImport;
  affixBackgroundColor: TokenImport;
  /** Build-time config, baked directly into the generated component. */
  clearIcon: string;
}): ComponentSourceFiles {
  const {
    borderRadius,
    border,
    backgroundColor,
    color,
    typography,
    placeholderColor,
    horizontalSpacing,
    verticalSpacing,
    gap,
    hoverBorderColor,
    focusBorderColor,
    focusRingColor,
    invalidBorderColor,
    disabledBackgroundColor,
    disabledColor,
    readOnlyBackgroundColor,
    iconColor,
    iconSize,
    affixColor,
    affixBackgroundColor,
    clearIcon,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const textInputRoot = style({
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  width: "100%",
  gap: ${gap.reference},
  border: ${border.reference},
  borderRadius: ${borderRadius.reference},
  backgroundColor: ${backgroundColor.reference},
  paddingLeft: ${horizontalSpacing.reference},
  paddingRight: ${horizontalSpacing.reference},
  ":hover": {
    borderColor: ${hoverBorderColor.reference},
  },
  ":focus-within": {
    borderColor: ${focusBorderColor.reference},
    ${focusRingColor ? `outline: "none",\n    boxShadow: \`0 0 0 2px \${${focusRingColor.reference}}\`,` : ""}
  },
  selectors: {
    "&[data-invalid]": {
      borderColor: ${invalidBorderColor.reference},
    },
    "&[data-readonly]": {
      backgroundColor: ${readOnlyBackgroundColor.reference},
    },
    "&[data-disabled]": {
      backgroundColor: ${disabledBackgroundColor.reference},
      color: ${disabledColor.reference},
      cursor: "not-allowed",
    },
  },
});

export const textInputField = style({
  flex: 1,
  minWidth: 0,
  boxSizing: "border-box",
  border: "none",
  outline: "none",
  background: "none",
  color: ${color.reference},
  paddingTop: ${verticalSpacing.reference},
  paddingBottom: ${verticalSpacing.reference},
  ${typographyProps(typography.reference)},
  "::placeholder": {
    color: ${placeholderColor.reference},
  },
  selectors: {
    "&:disabled": {
      color: ${disabledColor.reference},
      cursor: "not-allowed",
    },
  },
});

export const textInputIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  color: ${iconColor.reference},
  width: ${iconSize.reference},
  height: ${iconSize.reference},
});

export const textInputAffix = style({
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
  boxSizing: "border-box",
  height: "100%",
  color: ${affixColor.reference},
  backgroundColor: ${affixBackgroundColor.reference},
  ${typographyProps(typography.reference)},
});

export const textInputClear = style({
  display: "inline-flex",
  flexShrink: 0,
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: ${iconColor.reference},
});
`,
    component: `import type { ChangeEventHandler, ComponentPropsWithoutRef, ReactNode } from "react";
import {
  textInputAffix,
  textInputClear,
  textInputField,
  textInputIcon,
  textInputRoot,
} from "./TextInput.gen.css";
import { renderElement, type CommonComponentProps, type FieldableInputProps, type RenderProp } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";

const ClearIcon = icons[${JSON.stringify(clearIcon)}];

export interface TextInputProps extends CommonComponentProps, FieldableInputProps {
  value?: string;
  defaultValue?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  type?: "text" | "email" | "password" | "search" | "tel" | "url";
  placeholder?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  maxLength?: number;
  iconLeft?: IconType;
  iconRight?: IconType;
  prefix?: ReactNode;
  suffix?: ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  render?: RenderProp<"input">;
}

export function TextInput({
  value,
  defaultValue,
  onChange,
  type = "text",
  placeholder,
  readOnly = false,
  autoFocus = false,
  autoComplete,
  maxLength,
  iconLeft,
  iconRight,
  prefix,
  suffix,
  clearable = false,
  onClear,
  name,
  disabled = false,
  required = false,
  invalid = false,
  onFocus,
  onBlur,
  className,
  render,
  ...props
}: TextInputProps) {
  const IconLeft = iconLeft ? icons[iconLeft] : undefined;
  const IconRight = iconRight ? icons[iconRight] : undefined;
  const classes = [textInputRoot, className].filter(Boolean).join(" ");

  const fieldProps: Record<string, unknown> = {
    ...props,
    value,
    defaultValue,
    onChange,
    type,
    placeholder,
    readOnly,
    autoFocus,
    autoComplete,
    maxLength,
    name,
    disabled,
    required,
    onFocus,
    onBlur,
    className: textInputField,
  };

  return (
    <div
      className={classes}
      data-slot="text-input"
      data-invalid={invalid || undefined}
      data-readonly={readOnly || undefined}
      data-disabled={disabled || undefined}
    >
      {prefix !== undefined && <span className={textInputAffix}>{prefix}</span>}
      {IconLeft && <IconLeft className={textInputIcon} aria-hidden="true" />}
      {renderElement("input", render, fieldProps as ComponentPropsWithoutRef<"input">)}
      {clearable && value !== undefined && value !== "" && (
        <button type="button" className={textInputClear} aria-label="Clear" onClick={onClear}>
          <ClearIcon className={textInputIcon} aria-hidden="true" />
        </button>
      )}
      {IconRight && <IconRight className={textInputIcon} aria-hidden="true" />}
      {suffix !== undefined && <span className={textInputAffix}>{suffix}</span>}
    </div>
  );
}
`,
  };
}

import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import type { IconName } from "../internal/icon-map-icons.js";
import { vanillaExtractComponentOutput } from "./shared.js";

export type TextInputComponentOptions = {
  borderRadius: TokenBinding<"dimension">;
  border: TokenBinding<"border">;
  backgroundColor: TokenBinding<"color">;
  color: TokenBinding<"color">;
  typography: TokenBinding<"typography">;
  placeholderColor: TokenBinding<"color">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
  hoverBorderColor: TokenBinding<"color">;
  focusBorderColor: TokenBinding<"color">;
  invalidBorderColor: TokenBinding<"color">;
  disabledBackgroundColor: TokenBinding<"color">;
  disabledColor: TokenBinding<"color">;
  readOnlyBackgroundColor: TokenBinding<"color">;
  iconColor: TokenBinding<"color">;
  iconSize: TokenBinding<"dimension">;
  affixColor: TokenBinding<"color">;
  affixBackgroundColor: TokenBinding<"color">;
  clearIcon: IconName;
};

export const textInputComponent = defineRegistryComponent<TextInputComponentOptions>()({
  id: "text-input",
  name: "TextInput",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    borderRadius: { kind: "token", type: "dimension", description: "Corner radius of the input." },
    border: { kind: "token", type: "border", description: "Border applied around the input." },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the input.",
    },
    color: { kind: "token", type: "color", description: "Text color of the input." },
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to the input.",
    },
    placeholderColor: {
      kind: "token",
      type: "color",
      description: "Text color of the placeholder.",
    },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the input.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the input.",
    },
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between affixes, icons and the field.",
    },
    hoverBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the input on hover.",
    },
    focusBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the input on focus.",
    },
    invalidBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the input when invalid.",
    },
    disabledBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the input when disabled.",
    },
    disabledColor: {
      kind: "token",
      type: "color",
      description: "Text color of the input when disabled.",
    },
    readOnlyBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the input when read-only.",
    },
    iconColor: {
      kind: "token",
      type: "color",
      description: "Color of the leading/trailing icons.",
    },
    iconSize: {
      kind: "token",
      type: "dimension",
      description: "Size of the leading/trailing icons.",
    },
    affixColor: { kind: "token", type: "color", description: "Text color of the prefix/suffix." },
    affixBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the prefix/suffix.",
    },
    clearIcon: { kind: "icon", description: "Icon used by the clear button." },
  },
  output: vanillaExtractComponentOutput(
    "text-input",
    "TextInput",
    (_scales, _breakpoints, tokens, focusRingColor, icons) =>
      generateTextInputSources({
        borderRadius: tokens.borderRadius!,
        border: tokens.border!,
        backgroundColor: tokens.backgroundColor!,
        color: tokens.color!,
        typography: tokens.typography!,
        placeholderColor: tokens.placeholderColor!,
        horizontalSpacing: tokens.horizontalSpacing!,
        verticalSpacing: tokens.verticalSpacing!,
        gap: tokens.gap!,
        hoverBorderColor: tokens.hoverBorderColor!,
        focusBorderColor: tokens.focusBorderColor!,
        focusRingColor,
        invalidBorderColor: tokens.invalidBorderColor!,
        disabledBackgroundColor: tokens.disabledBackgroundColor!,
        disabledColor: tokens.disabledColor!,
        readOnlyBackgroundColor: tokens.readOnlyBackgroundColor!,
        iconColor: tokens.iconColor!,
        iconSize: tokens.iconSize!,
        affixColor: tokens.affixColor!,
        affixBackgroundColor: tokens.affixBackgroundColor!,
        clearIcon: icons.clearIcon!,
      }),
  ),
});
