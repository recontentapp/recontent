import type { ChangeEventHandler, ComponentPropsWithoutRef, ReactNode } from "react";
import {
  textInputAffix,
  textInputClear,
  textInputField,
  textInputIcon,
  textInputRoot,
} from "./TextInput.gen.css";
import { renderElement, type CommonComponentProps, type FieldableInputProps, type RenderProp } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";

const ClearIcon = icons["close"];

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
