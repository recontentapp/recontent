import type { ReactNode } from "react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import {
  autocompleteChip,
  autocompleteChipRemove,
  autocompleteChips,
  autocompleteClear,
  autocompleteEmpty,
  autocompleteHighlight,
  autocompleteIcon,
  autocompleteInput,
  autocompleteItem,
  autocompleteItemStart,
  autocompletePopup,
  autocompletePositioner,
  autocompleteTrigger,
  autocompleteTriggerIcons,
} from "./Autocomplete.gen.css";
import type { CommonComponentProps, FieldableInputProps, RenderProp } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";

const SelectedIcon = icons["check"];
const ClearIcon = icons["close"];
const SearchIcon = icons["search"];

export interface SelectOption<Value extends string> {
  value: Value;
  label: ReactNode;
  icon?: IconType;
  disabled?: boolean;
}

export interface AutocompleteProps<Value extends string>
  extends CommonComponentProps, FieldableInputProps {
  options: SelectOption<Value>[];
  value?: Value | Value[];
  defaultValue?: Value | Value[];
  onValueChange?: (value: Value | Value[]) => void;
  multiple?: boolean;
  placeholder?: ReactNode;
  inputValue?: string;
  onInputValueChange?: (query: string) => void;
  loading?: boolean;
  emptyState?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  render?: RenderProp<"input">;
}

function highlightMatch(label: ReactNode, query: string) {
  if (typeof label !== "string" || !query) return label;
  const index = label.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return label;
  return (
    <>
      {label.slice(0, index)}
      <mark className={autocompleteHighlight}>{label.slice(index, index + query.length)}</mark>
      {label.slice(index + query.length)}
    </>
  );
}

export function Autocomplete<Value extends string>({
  options,
  value,
  defaultValue,
  onValueChange,
  multiple = false,
  placeholder,
  inputValue,
  onInputValueChange,
  loading = false,
  emptyState,
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
}: AutocompleteProps<Value>) {
  const classes = [autocompleteTrigger, className].filter(Boolean).join(" ");
  const query = inputValue ?? "";
  const filteredOptions = query
    ? options.filter((option) =>
        (typeof option.label === "string" ? option.label : option.value)
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : options;

  return (
    <BaseCombobox.Root
      value={value ?? null}
      defaultValue={defaultValue}
      onValueChange={(next) => onValueChange?.(next as Value | Value[])}
      multiple={multiple}
      inputValue={inputValue}
      onInputValueChange={onInputValueChange}
      name={name}
      disabled={disabled}
      aria-required={required || undefined}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <div className={classes} data-slot="autocomplete-trigger" data-loading={loading || undefined}>
        {multiple && (
          <BaseCombobox.Chips className={autocompleteChips}>
            {(Array.isArray(value) ? value : []).map((chipValue) => {
              const option = options.find((o) => o.value === chipValue);
              return (
                <BaseCombobox.Chip key={chipValue} className={autocompleteChip}>
                  {option?.label ?? chipValue}
                  <BaseCombobox.ChipRemove className={autocompleteChipRemove} aria-label="Remove">
                    <ClearIcon className={autocompleteIcon} aria-hidden="true" />
                  </BaseCombobox.ChipRemove>
                </BaseCombobox.Chip>
              );
            })}
          </BaseCombobox.Chips>
        )}
        <SearchIcon className={autocompleteIcon} aria-hidden="true" />
        <BaseCombobox.Input
          {...props}
          placeholder={typeof placeholder === "string" ? placeholder : undefined}
          onFocus={onFocus}
          onBlur={onBlur}
          data-invalid={invalid || undefined}
          render={render}
          className={autocompleteInput}
        />
        <span className={autocompleteTriggerIcons}>
          {value !== undefined && (Array.isArray(value) ? value.length > 0 : value !== null) && (
            <BaseCombobox.Clear className={autocompleteClear} aria-label="Clear">
              <ClearIcon className={autocompleteIcon} aria-hidden="true" />
            </BaseCombobox.Clear>
          )}
        </span>
      </div>
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner className={autocompletePositioner}>
          <BaseCombobox.Popup className={autocompletePopup} data-slot="autocomplete-popup">
            <BaseCombobox.Empty className={autocompleteEmpty}>
              {emptyState ?? "No results found."}
            </BaseCombobox.Empty>
            <BaseCombobox.List>
              {filteredOptions.map((option) => {
                const OptionIcon = option.icon ? icons[option.icon] : undefined;
                return (
                  <BaseCombobox.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={autocompleteItem}
                  >
                    <span className={autocompleteItemStart}>
                      {OptionIcon && <OptionIcon className={autocompleteIcon} aria-hidden="true" />}
                      <span>{highlightMatch(option.label, query)}</span>
                    </span>
                    <BaseCombobox.ItemIndicator>
                      <SelectedIcon className={autocompleteIcon} aria-hidden="true" />
                    </BaseCombobox.ItemIndicator>
                  </BaseCombobox.Item>
                );
              })}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}
