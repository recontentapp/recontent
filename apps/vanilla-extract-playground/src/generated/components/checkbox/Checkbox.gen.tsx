import type { ReactNode } from "react";
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

export type CheckboxSize = "sm" | "md";

const CheckedIcon = icons["check"];
const IndeterminateIcon = icons["close"];

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
