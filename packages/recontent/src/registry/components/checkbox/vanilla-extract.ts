import type { ComponentSourceFiles, ScaleImport, TokenImport } from "../../types.js";

export function generateCheckboxSources(bindings: {
  sizes: ScaleImport;
  border: TokenImport;
  borderRadius: TokenImport;
  backgroundColor: TokenImport;
  checkedBackgroundColor: TokenImport;
  checkedColor: TokenImport;
  hoverBorderColor: TokenImport;
  focusRingColor: TokenImport;
  invalidBorderColor: TokenImport;
  disabledBackgroundColor: TokenImport;
  disabledColor: TokenImport;
  labelTypography: TokenImport;
  labelColor: TokenImport;
  gap: TokenImport;
  /** Build-time config, baked directly into the generated component. */
  checkedIcon: string;
  indeterminateIcon: string;
}): ComponentSourceFiles {
  const {
    sizes,
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
    labelTypography,
    labelColor,
    gap,
    checkedIcon,
    indeterminateIcon,
  } = bindings;

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { ${sizes.exportName} } from "../../tokens.css";
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
  width: "1rem",
  height: "1rem",
  border: ${border.reference},
  borderRadius: ${borderRadius.reference},
  backgroundColor: ${backgroundColor.reference},
  ":hover": {
    borderColor: ${hoverBorderColor.reference},
  },
  ":focus-visible": {
    outline: \`2px solid \${${focusRingColor.reference}}\`,
    outlineOffset: "2px",
  },
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

export const checkboxSize = styleVariants(${sizes.exportName}, (value) => ({
  width: value,
  height: value,
}));

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

export const checkboxLabel = style({
  color: ${labelColor.reference},
  fontFamily: ${labelTypography.reference}.fontFamily,
  fontSize: ${labelTypography.reference}.fontSize,
  fontWeight: ${labelTypography.reference}.fontWeight,
  letterSpacing: ${labelTypography.reference}.letterSpacing,
  lineHeight: ${labelTypography.reference}.lineHeight,
});
`,
    component: `import type { ReactNode } from "react";
import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import {
  checkboxBox,
  checkboxIndicator,
  checkboxLabel,
  checkboxRoot,
  checkboxSize,
} from "./Checkbox.gen.css";
import type { CommonComponentProps, FieldableInputProps, RenderProp } from "../../renderElement.gen";
import { icons } from "../../iconMap";
import type { ${sizes.typeName} as CheckboxSizeToken } from "../../tokens.css";

const CheckedIcon = icons[${JSON.stringify(checkedIcon)}];
const IndeterminateIcon = icons[${JSON.stringify(indeterminateIcon)}];

export interface CheckboxProps extends CommonComponentProps, FieldableInputProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  value?: string;
  label?: ReactNode;
  size?: CheckboxSizeToken;
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
          {indeterminate ? <IndeterminateIcon /> : <CheckedIcon />}
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      {label !== undefined && <span className={checkboxLabel}>{label}</span>}
    </label>
  );
}
`,
  };
}
