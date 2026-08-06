import { useState, type ChangeEventHandler, type ComponentPropsWithoutRef, type CSSProperties } from "react";
import { textareaCounter, textareaField, textareaRoot } from "./Textarea.gen.css";
import { renderElement, type CommonComponentProps, type FieldableInputProps, type RenderProp } from "../../renderElement.gen";

export interface TextareaProps extends CommonComponentProps, FieldableInputProps {
  value?: string;
  defaultValue?: string;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
  placeholder?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
  showCharacterCount?: boolean;
  maxLength?: number;
  render?: RenderProp<"textarea">;
}

export function Textarea({
  value,
  defaultValue,
  onChange,
  placeholder,
  readOnly = false,
  autoFocus = false,
  autoResize = false,
  minRows = 3,
  maxRows,
  showCharacterCount = false,
  maxLength,
  name,
  disabled = false,
  required = false,
  invalid = false,
  onFocus,
  onBlur,
  className,
  render,
  ...props
}: TextareaProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? "");
  const isControlled = value !== undefined;
  const currentValue = isControlled ? (value ?? "") : uncontrolledValue;

  const style: CSSProperties = autoResize
    ? {
        fieldSizing: "content" as never,
        minHeight: `calc(${minRows} * 1.5em)`,
        maxHeight: maxRows !== undefined ? `calc(${maxRows} * 1.5em)` : undefined,
      }
    : { minHeight: `calc(${minRows} * 1.5em)` };

  const fieldProps: Record<string, unknown> = {
    ...props,
    value,
    defaultValue,
    onChange: (event: Parameters<ChangeEventHandler<HTMLTextAreaElement>>[0]) => {
      if (!isControlled) setUncontrolledValue(event.target.value);
      onChange?.(event);
    },
    placeholder,
    readOnly,
    autoFocus,
    maxLength,
    rows: minRows,
    name,
    disabled,
    required,
    onFocus,
    onBlur,
    "data-invalid": invalid || undefined,
    "data-auto-resize": autoResize || undefined,
    style,
    className: textareaField,
  };

  return (
    <div className={textareaRoot} data-slot="textarea">
      {renderElement("textarea", render, fieldProps as ComponentPropsWithoutRef<"textarea">)}
      {showCharacterCount && (
        <span
          className={textareaCounter}
          data-exceeded={(maxLength !== undefined && currentValue.length > maxLength) || undefined}
        >
          {currentValue.length}
          {maxLength !== undefined ? `/${maxLength}` : ""}
        </span>
      )}
    </div>
  );
}
