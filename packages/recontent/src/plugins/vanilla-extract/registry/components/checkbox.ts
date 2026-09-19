import type { ComponentSourceFiles, TokenImport } from "../types.js";
import { focusRingBlock, groupVariantTokens } from "./shared.js";

const SIZE_FIELDS = ["boxSize", "labelTypography"] as const;

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n    ");
}

function sizeStyleBody(fields: Record<string, TokenImport>): string {
  return `{
    width: ${fields.boxSize!.reference},
    height: ${fields.boxSize!.reference},
  }`;
}

function labelSizeStyleBody(fields: Record<string, TokenImport>): string {
  return `{
    ${typographyProps(fields.labelTypography!.reference)},
  }`;
}

function generateCheckboxSources(bindings: {
  border: TokenImport;
  borderRadius: TokenImport;
  backgroundColor: TokenImport;
  checkedBackgroundColor: TokenImport;
  checkedColor: TokenImport;
  hoverBorderColor: TokenImport;
  focusRingColor: TokenImport | undefined;
  invalidBorderColor: TokenImport;
  disabledBackgroundColor: TokenImport;
  disabledColor: TokenImport;
  labelColor: TokenImport;
  gap: TokenImport;
  tokens: Record<string, TokenImport>;
  /** Build-time config, baked directly into the generated component. */
  checkedIcon: string;
  indeterminateIcon: string;
}): ComponentSourceFiles {
  const {
    border,
    borderRadius,
    backgroundColor,
    checkedBackgroundColor,
    checkedColor,
    hoverBorderColor,
    focusRingColor,
    invalidBorderColor,
    disabledBackgroundColor,
    disabledColor,
    labelColor,
    gap,
    tokens,
    checkedIcon,
    indeterminateIcon,
  } = bindings;

  const sizes = groupVariantTokens(tokens, "sizes", SIZE_FIELDS);
  const sizeNames = Object.keys(sizes);

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const checkboxRoot = style({
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  gap: ${gap.reference},
  selectors: {
    "&[data-disabled]": {
      cursor: "not-allowed",
    },
  },
});

export const checkboxBox = style({
  boxSizing: "border-box",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  overflow: "hidden",
  width: "1rem",
  height: "1rem",
  border: ${border.reference},
  borderRadius: ${borderRadius.reference},
  backgroundColor: ${backgroundColor.reference},
  ":hover": {
    borderColor: ${hoverBorderColor.reference},
  },
  ${focusRingBlock(focusRingColor)}
  selectors: {
    "&[data-checked], &[data-indeterminate]": {
      backgroundColor: ${checkedBackgroundColor.reference},
    },
    "&[data-invalid]": {
      borderColor: ${invalidBorderColor.reference},
    },
    "&[data-disabled]": {
      backgroundColor: ${disabledBackgroundColor.reference},
      cursor: "not-allowed",
    },
  },
});

export const checkboxSize = styleVariants({
${sizeNames.map((name) => `  ${JSON.stringify(name)}: ${sizeStyleBody(sizes[name]!)},`).join("\n")}
});

export const checkboxLabelSize = styleVariants({
${sizeNames.map((name) => `  ${JSON.stringify(name)}: ${labelSizeStyleBody(sizes[name]!)},`).join("\n")}
});

export const checkboxIndicator = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  color: ${checkedColor.reference},
  selectors: {
    "[data-disabled] &": {
      color: ${disabledColor.reference},
    },
  },
});

export const checkboxIndicatorIcon = style({
  width: "100%",
  height: "100%",
});

export const checkboxLabel = style({
  color: ${labelColor.reference},
});
`,
    component: `import type { ReactNode } from "react";
import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import {
  checkboxBox,
  checkboxIndicator,
  checkboxIndicatorIcon,
  checkboxLabel,
  checkboxLabelSize,
  checkboxRoot,
  checkboxSize,
} from "./Checkbox.gen.css";
import type { CommonComponentProps, FieldableInputProps, RenderProp } from "../../renderElement.gen";
import { icons } from "../../iconMap";

export type CheckboxSize = ${sizeNames.map((n) => JSON.stringify(n)).join(" | ")};

const CheckedIcon = icons[${JSON.stringify(checkedIcon)}];
const IndeterminateIcon = icons[${JSON.stringify(indeterminateIcon)}];

export interface CheckboxProps extends CommonComponentProps, FieldableInputProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  value?: string;
  label?: ReactNode;
  size?: CheckboxSize;
  indeterminate?: boolean;
  render?: RenderProp<"button">;
}

export function Checkbox({
  checked,
  defaultChecked,
  onCheckedChange,
  value,
  label,
  size,
  indeterminate = false,
  name,
  disabled = false,
  required = false,
  invalid = false,
  onFocus,
  onBlur,
  className,
  render,
  ...props
}: CheckboxProps) {
  const classes = [checkboxRoot, className].filter(Boolean).join(" ");

  return (
    <label className={classes} data-disabled={disabled || undefined} data-slot="checkbox">
      <BaseCheckbox.Root
        {...props}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={(next) => onCheckedChange?.(next)}
        value={value}
        name={name}
        disabled={disabled}
        required={required}
        indeterminate={indeterminate}
        onFocus={onFocus}
        onBlur={onBlur}
        data-invalid={invalid || undefined}
        render={render}
        className={[checkboxBox, size !== undefined && checkboxSize[size]].filter(Boolean).join(" ")}
      >
        <BaseCheckbox.Indicator className={checkboxIndicator} keepMounted={false}>
          {indeterminate ? (
            <IndeterminateIcon className={checkboxIndicatorIcon} />
          ) : (
            <CheckedIcon className={checkboxIndicatorIcon} />
          )}
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      {label !== undefined && (
        <span
          className={[checkboxLabel, size !== undefined && checkboxLabelSize[size]]
            .filter(Boolean)
            .join(" ")}
        >
          {label}
        </span>
      )}
    </label>
  );
}
`,
  };
}

import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import type { IconName } from "../internal/icon-map-icons.js";
import { vanillaExtractComponentOutput } from "./shared.js";

type CheckboxSizeFields = {
  boxSize: TokenBinding<"dimension">;
  labelTypography: TokenBinding<"typography">;
};

export type CheckboxComponentOptions = {
  sizes: Record<string, CheckboxSizeFields>;
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
  backgroundColor: TokenBinding<"color">;
  checkedBackgroundColor: TokenBinding<"color">;
  checkedColor: TokenBinding<"color">;
  hoverBorderColor: TokenBinding<"color">;
  invalidBorderColor: TokenBinding<"color">;
  disabledBackgroundColor: TokenBinding<"color">;
  disabledColor: TokenBinding<"color">;
  labelColor: TokenBinding<"color">;
  gap: TokenBinding<"dimension">;
  checkedIcon: IconName;
  indeterminateIcon: IconName;
};

export const checkboxComponent = defineRegistryComponent<CheckboxComponentOptions>()({
  id: "checkbox",
  name: "Checkbox",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    sizes: {
      kind: "variants",
      description:
        "Consumer-defined sizes, drives the size prop. Pairs the box dimension with the label's typography so both scale together.",
      fields: {
        boxSize: { kind: "token", type: "dimension" },
        labelTypography: { kind: "token", type: "typography" },
      },
    },
    border: {
      kind: "token",
      type: "border",
      description: "Border applied around the box.",
    },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the box.",
    },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the box when unchecked.",
    },
    checkedBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the box when checked.",
    },
    checkedColor: {
      kind: "token",
      type: "color",
      description: "Color of the check mark.",
    },
    hoverBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the box on hover.",
    },
    invalidBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the box when invalid.",
    },
    disabledBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the box when disabled.",
    },
    disabledColor: {
      kind: "token",
      type: "color",
      description: "Color of the check mark when disabled.",
    },
    labelColor: {
      kind: "token",
      type: "color",
      description: "Text color of the label.",
    },
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between the box and the label.",
    },
    checkedIcon: { kind: "icon", description: "Icon shown when checked." },
    indeterminateIcon: { kind: "icon", description: "Icon shown when indeterminate." },
  },
  output: vanillaExtractComponentOutput(
    "checkbox",
    "Checkbox",
    (_scales, _breakpoints, tokens, focusRingColor, icons) =>
      generateCheckboxSources({
        border: tokens.border!,
        borderRadius: tokens.borderRadius!,
        backgroundColor: tokens.backgroundColor!,
        checkedBackgroundColor: tokens.checkedBackgroundColor!,
        checkedColor: tokens.checkedColor!,
        hoverBorderColor: tokens.hoverBorderColor!,
        focusRingColor,
        invalidBorderColor: tokens.invalidBorderColor!,
        disabledBackgroundColor: tokens.disabledBackgroundColor!,
        disabledColor: tokens.disabledColor!,
        labelColor: tokens.labelColor!,
        gap: tokens.gap!,
        tokens,
        checkedIcon: icons.checkedIcon!,
        indeterminateIcon: icons.indeterminateIcon!,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
