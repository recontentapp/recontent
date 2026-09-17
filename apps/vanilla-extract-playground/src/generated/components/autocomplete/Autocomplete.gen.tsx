import { useRef, type ReactNode } from "react";
import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import {
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

const ClearIcon = icons["close"];
const SearchIcon = icons["search"];

export interface AutocompleteOption<Value extends string> {
  value: Value;
  label: ReactNode;
  icon?: IconType;
  disabled?: boolean;
}

export interface AutocompleteProps<Value extends string>
  extends CommonComponentProps, FieldableInputProps {
  options: AutocompleteOption<Value>[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onItemClick?: (value: Value, event: React.MouseEvent<HTMLElement>) => void;
  placeholder?: ReactNode;
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
  onItemClick,
  placeholder,
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
  const triggerRef = useRef<HTMLDivElement>(null);
  const query = value ?? "";

  return (
    <BaseAutocomplete.Root
      items={options}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => onValueChange?.(next)}
      name={name}
      disabled={disabled}
      required={required}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <div
        ref={triggerRef}
        className={classes}
        data-slot="autocomplete-trigger"
      >
        <SearchIcon className={autocompleteIcon} aria-hidden="true" />
        <BaseAutocomplete.Input
          {...props}
          placeholder={typeof placeholder === "string" ? placeholder : undefined}
          onFocus={onFocus}
          onBlur={onBlur}
          data-invalid={invalid || undefined}
          render={render}
          className={autocompleteInput}
        />
        <span className={autocompleteTriggerIcons}>
          {value !== undefined && value !== "" && (
            <BaseAutocomplete.Clear className={autocompleteClear} aria-label="Clear">
              <ClearIcon className={autocompleteIcon} aria-hidden="true" />
            </BaseAutocomplete.Clear>
          )}
        </span>
      </div>
      <BaseAutocomplete.Portal>
        <BaseAutocomplete.Positioner className={autocompletePositioner} anchor={triggerRef}>
          <BaseAutocomplete.Popup className={autocompletePopup} data-slot="autocomplete-popup">
            <BaseAutocomplete.Empty className={autocompleteEmpty}>
              {emptyState ?? "No results found."}
            </BaseAutocomplete.Empty>
            <BaseAutocomplete.List>
              {(option: AutocompleteOption<Value>) => {
                const OptionIcon = option.icon ? icons[option.icon] : undefined;
                return (
                  <BaseAutocomplete.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    onClick={(event) => onItemClick?.(option.value, event)}
                    className={autocompleteItem}
                  >
                    <span className={autocompleteItemStart}>
                      {OptionIcon && <OptionIcon className={autocompleteIcon} aria-hidden="true" />}
                      <span>{highlightMatch(option.label, query)}</span>
                    </span>
                  </BaseAutocomplete.Item>
                );
              }}
            </BaseAutocomplete.List>
          </BaseAutocomplete.Popup>
        </BaseAutocomplete.Positioner>
      </BaseAutocomplete.Portal>
    </BaseAutocomplete.Root>
  );
}
