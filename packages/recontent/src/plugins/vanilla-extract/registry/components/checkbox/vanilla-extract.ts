import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { focusRingBlock, groupVariantTokens } from "../shared.js";

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

export function generateCheckboxSources(bindings: {
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
