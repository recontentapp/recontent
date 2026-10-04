import type { ComponentSourceFiles, TokenImport } from "../types.js";
import { focusRingBlock, typographyProps } from "./shared.js";
import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import type { IconName } from "../internal/icon-map-icons.js";
import { vanillaExtractComponentOutput } from "./shared.js";

function generateCheckboxSources(bindings: {
  boxSize: TokenImport;
  labelTypography: TokenImport;
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
  /** Build-time config, baked directly into the generated component. */
  checkedIcon: string;
  indeterminateIcon: string;
}): ComponentSourceFiles {
  const {
    boxSize,
    labelTypography,
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
    checkedIcon,
    indeterminateIcon,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
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
  width: ${boxSize.reference},
  height: ${boxSize.reference},
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
  ${typographyProps(labelTypography.reference, "      ")},
});
`,
    component: `import type { ReactNode } from "react";
import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import {
  checkboxBox,
  checkboxIndicator,
  checkboxIndicatorIcon,
  checkboxLabel,
  checkboxRoot,
} from "./Checkbox.gen.css";
import type { CommonComponentProps, FieldableInputProps, RenderProp } from "../../renderElement.gen";
import { icons } from "../../iconMap";

const CheckedIcon = icons[${JSON.stringify(checkedIcon)}];
const IndeterminateIcon = icons[${JSON.stringify(indeterminateIcon)}];

export interface CheckboxProps extends CommonComponentProps, FieldableInputProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  value?: string;
  label?: ReactNode;
  indeterminate?: boolean;
  render?: RenderProp<"button">;
}

export function Checkbox({
  checked,
  defaultChecked,
  onCheckedChange,
  value,
  label,
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
        className={checkboxBox}
      >
        <BaseCheckbox.Indicator className={checkboxIndicator} keepMounted={false}>
          {indeterminate ? (
            <IndeterminateIcon className={checkboxIndicatorIcon} />
          ) : (
            <CheckedIcon className={checkboxIndicatorIcon} />
          )}
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      {label !== undefined && <span className={checkboxLabel}>{label}</span>}
    </label>
  );
}
`,
  };
}

export type CheckboxComponentOptions = {
  boxSize: TokenBinding<"dimension">;
  labelTypography: TokenBinding<"typography">;
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
    boxSize: { kind: "token", type: "dimension", description: "Width and height of the box." },
    labelTypography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to the label.",
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
        boxSize: tokens.boxSize!,
        labelTypography: tokens.labelTypography!,
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
        checkedIcon: icons.checkedIcon!,
        indeterminateIcon: icons.indeterminateIcon!,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
