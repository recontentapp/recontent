import type { ReactNode } from "react";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import {
  radioListContent,
  radioListControl,
  radioListControlSize,
  radioListDescription,
  radioListIndicator,
  radioListLabel,
  radioListOption,
  radioListRoot,
  radioListRootOrientation,
} from "./RadioList.gen.css";
import type { CommonComponentProps, FieldableInputProps, RenderProp } from "../../renderElement.gen";
import type { RefIconScale as RadioListSizeToken } from "../../tokens.css";

export interface RadioListOption<Value extends string> {
  value: Value;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface RadioListProps<Value extends string>
  extends CommonComponentProps, FieldableInputProps {
  options: RadioListOption<Value>[];
  value?: Value;
  defaultValue?: Value;
  onValueChange?: (value: Value) => void;
  orientation?: "horizontal" | "vertical";
  size?: RadioListSizeToken;
  render?: RenderProp<"div">;
}

export function RadioList<Value extends string>({
  options,
  value,
  defaultValue,
  onValueChange,
  orientation = "vertical",
  size,
  name,
  disabled = false,
  required = false,
  invalid = false,
  onFocus,
  onBlur,
  className,
  render,
  ...props
}: RadioListProps<Value>) {
  const classes = [radioListRoot, radioListRootOrientation[orientation], className]
    .filter(Boolean)
    .join(" ");

  return (
    <BaseRadioGroup
      {...props}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => onValueChange?.(next as Value)}
      name={name}
      disabled={disabled}
      required={required}
      render={render}
      className={classes}
      data-slot="radio-list"
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={radioListOption}
          data-disabled={disabled || option.disabled || undefined}
        >
          <BaseRadio.Root
            value={option.value}
            disabled={disabled || option.disabled}
            onFocus={onFocus}
            onBlur={onBlur}
            data-invalid={invalid || undefined}
            className={[radioListControl, size !== undefined && radioListControlSize[size]]
              .filter(Boolean)
              .join(" ")}
          >
            <BaseRadio.Indicator className={radioListIndicator} keepMounted={false} />
          </BaseRadio.Root>
          <div className={radioListContent}>
            <span className={radioListLabel}>{option.label}</span>
            {option.description !== undefined && (
              <span className={radioListDescription}>{option.description}</span>
            )}
          </div>
        </label>
      ))}
    </BaseRadioGroup>
  );
}
