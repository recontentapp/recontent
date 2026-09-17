import type { ReactNode } from "react";
import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import {
  numberInputAffix,
  numberInputField,
  numberInputGroup,
  numberInputIcon,
  numberInputIncrementIcon,
  numberInputStepper,
  numberInputStepperButton,
} from "./NumberInput.gen.css";
import type { CommonComponentProps, FieldableInputProps, RenderProp } from "../../renderElement.gen";
import { icons } from "../../iconMap";

const IncrementIcon = icons["chevronDown"];
const DecrementIcon = icons["chevronDown"];

export interface NumberInputProps extends CommonComponentProps, FieldableInputProps {
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  largeStep?: number;
  format?: Intl.NumberFormatOptions;
  locale?: string;
  showStepper?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  render?: RenderProp<"input">;
}

export function NumberInput({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step,
  largeStep,
  format,
  locale,
  showStepper = true,
  readOnly = false,
  placeholder,
  prefix,
  suffix,
  name,
  disabled = false,
  required = false,
  invalid = false,
  onFocus,
  onBlur,
  className,
  render,
  ...props
}: NumberInputProps) {
  const classes = [numberInputGroup, className].filter(Boolean).join(" ");

  return (
    <BaseNumberField.Root
      value={value}
      defaultValue={defaultValue ?? undefined}
      onValueChange={(next) => onValueChange?.(next)}
      min={min}
      max={max}
      step={step}
      largeStep={largeStep}
      format={format}
      locale={locale}
      readOnly={readOnly}
      name={name}
      disabled={disabled}
      required={required}
    >
      <BaseNumberField.Group
        {...props}
        data-invalid={invalid || undefined}
        data-readonly={readOnly || undefined}
        data-disabled={disabled || undefined}
        className={classes}
        data-slot="number-input"
      >
        {prefix !== undefined && <span className={numberInputAffix}>{prefix}</span>}
        <BaseNumberField.Input
          placeholder={placeholder}
          onFocus={onFocus}
          onBlur={onBlur}
          render={render}
          className={numberInputField}
        />
        {suffix !== undefined && <span className={numberInputAffix}>{suffix}</span>}
        {showStepper && (
          <span className={numberInputStepper}>
            <BaseNumberField.Increment className={numberInputStepperButton}>
              <IncrementIcon className={[numberInputIcon, numberInputIncrementIcon].join(" ")} aria-hidden="true" />
            </BaseNumberField.Increment>
            <BaseNumberField.Decrement className={numberInputStepperButton}>
              <DecrementIcon className={numberInputIcon} aria-hidden="true" />
            </BaseNumberField.Decrement>
          </span>
        )}
      </BaseNumberField.Group>
    </BaseNumberField.Root>
  );
}
