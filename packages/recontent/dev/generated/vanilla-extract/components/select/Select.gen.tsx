import type { ReactNode } from "react";
import { Select as BaseSelect } from "@base-ui/react/select";
import {
  selectClear,
  selectIcon,
  selectItem,
  selectItemStart,
  selectPlaceholder,
  selectPopup,
  selectPositioner,
  selectTrigger,
  selectTriggerIcons,
  selectValue,
} from "./Select.gen.css";
import type { CommonComponentProps, FieldableInputProps, RenderProp } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";

const IndicatorIcon = icons["chevronDown"];
const SelectedIcon = icons["check"];
const ClearIcon = icons["close"];

export interface SelectOption<Value extends string> {
  value: Value;
  label: ReactNode;
  icon?: IconType;
  disabled?: boolean;
}

export interface SelectProps<Value extends string>
  extends CommonComponentProps, FieldableInputProps {
  options: SelectOption<Value>[];
  value?: Value;
  defaultValue?: Value;
  onValueChange?: (value: Value) => void;
  placeholder?: ReactNode;
  clearable?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  render?: RenderProp<"button">;
}

export function Select<Value extends string>({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  clearable = false,
  open,
  defaultOpen,
  onOpenChange,
  name,
  disabled = false,
  required = false,
  invalid = false,
  onFocus,
  onBlur,
  className,
  render,
  ...props
}: SelectProps<Value>) {
  const classes = [selectTrigger, className].filter(Boolean).join(" ");

  return (
    <BaseSelect.Root
      items={options}
      value={value ?? null}
      defaultValue={defaultValue}
      onValueChange={(next) => next !== null && onValueChange?.(next as Value)}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      name={name}
      disabled={disabled}
      required={required}
    >
      <BaseSelect.Trigger
        {...props}
        onFocus={onFocus}
        onBlur={onBlur}
        data-invalid={invalid || undefined}
        render={render}
        className={classes}
        data-slot="select-trigger"
      >
        <BaseSelect.Value className={selectValue}>
          {(selected: Value | null) =>
            selected === null ? (
              <span className={selectPlaceholder}>{placeholder}</span>
            ) : (
              options.find((option) => option.value === selected)?.label
            )
          }
        </BaseSelect.Value>
        <span className={selectTriggerIcons}>
          {clearable && value !== undefined && value !== null && (
            <button
              type="button"
              className={selectClear}
              aria-label="Clear"
              onClick={(event) => {
                event.stopPropagation();
                onValueChange?.(null as never);
              }}
            >
              <ClearIcon className={selectIcon} aria-hidden="true" />
            </button>
          )}
          <BaseSelect.Icon>
            <IndicatorIcon className={selectIcon} aria-hidden="true" />
          </BaseSelect.Icon>
        </span>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner className={selectPositioner}>
          <BaseSelect.Popup className={selectPopup} data-slot="select-popup">
            {options.map((option) => {
              const OptionIcon = option.icon ? icons[option.icon] : undefined;
              return (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={selectItem}
                >
                  <span className={selectItemStart}>
                    {OptionIcon && <OptionIcon className={selectIcon} aria-hidden="true" />}
                    <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                  </span>
                  <BaseSelect.ItemIndicator>
                    <SelectedIcon className={selectIcon} aria-hidden="true" />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              );
            })}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
