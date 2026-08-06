import type { ComponentSourceFiles, TokenImport } from "../../types.js";

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

export function generateAutocompleteSources(bindings: {
  borderRadius: TokenImport;
  border: TokenImport;
  backgroundColor: TokenImport;
  color: TokenImport;
  typography: TokenImport;
  placeholderColor: TokenImport;
  horizontalSpacing: TokenImport;
  verticalSpacing: TokenImport;
  hoverBorderColor: TokenImport;
  focusBorderColor: TokenImport;
  focusRingColor: TokenImport;
  invalidBorderColor: TokenImport;
  disabledBackgroundColor: TokenImport;
  disabledColor: TokenImport;
  iconSize: TokenImport;
  popupBackgroundColor: TokenImport;
  popupBorder: TokenImport;
  popupBorderRadius: TokenImport;
  popupShadow: TokenImport;
  popupSpacing: TokenImport;
  popupOffset: TokenImport;
  itemColor: TokenImport;
  itemTypography: TokenImport;
  itemHoverBackgroundColor: TokenImport;
  itemSelectedBackgroundColor: TokenImport;
  itemSelectedColor: TokenImport;
  itemDisabledColor: TokenImport;
  itemHorizontalSpacing: TokenImport;
  itemVerticalSpacing: TokenImport;
  tagBackgroundColor: TokenImport;
  tagColor: TokenImport;
  tagBorderRadius: TokenImport;
  tagTypography: TokenImport;
  tagGap: TokenImport;
  emptyStateColor: TokenImport;
  emptyStateTypography: TokenImport;
  emptyStateSpacing: TokenImport;
  highlightColor: TokenImport;
  /** Build-time config, baked directly into the generated component. */
  selectedIcon: string;
  clearIcon: string;
  searchIcon: string;
}): ComponentSourceFiles {
  const {
    borderRadius,
    border,
    backgroundColor,
    color,
    typography,
    placeholderColor,
    horizontalSpacing,
    verticalSpacing,
    hoverBorderColor,
    focusBorderColor,
    focusRingColor,
    invalidBorderColor,
    disabledBackgroundColor,
    disabledColor,
    iconSize,
    popupBackgroundColor,
    popupBorder,
    popupBorderRadius,
    popupShadow,
    popupSpacing,
    popupOffset,
    itemColor,
    itemTypography,
    itemHoverBackgroundColor,
    itemSelectedBackgroundColor,
    itemSelectedColor,
    itemDisabledColor,
    itemHorizontalSpacing,
    itemVerticalSpacing,
    tagBackgroundColor,
    tagColor,
    tagBorderRadius,
    tagTypography,
    tagGap,
    emptyStateColor,
    emptyStateTypography,
    emptyStateSpacing,
    highlightColor,
    selectedIcon,
    clearIcon,
    searchIcon,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const autocompleteTrigger = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  boxSizing: "border-box",
  width: "100%",
  gap: ${tagGap.reference},
  color: ${color.reference},
  border: ${border.reference},
  borderRadius: ${borderRadius.reference},
  backgroundColor: ${backgroundColor.reference},
  paddingLeft: ${horizontalSpacing.reference},
  paddingRight: ${horizontalSpacing.reference},
  paddingTop: ${verticalSpacing.reference},
  paddingBottom: ${verticalSpacing.reference},
  ":hover": {
    borderColor: ${hoverBorderColor.reference},
  },
  ":focus-within": {
    borderColor: ${focusBorderColor.reference},
    outline: \`2px solid \${${focusRingColor.reference}}\`,
    outlineOffset: "2px",
  },
  selectors: {
    "&[data-invalid]": {
      borderColor: ${invalidBorderColor.reference},
    },
    "&[data-disabled]": {
      backgroundColor: ${disabledBackgroundColor.reference},
      color: ${disabledColor.reference},
      cursor: "not-allowed",
    },
  },
});

export const autocompleteInput = style({
  flex: 1,
  minWidth: "4rem",
  border: "none",
  outline: "none",
  background: "none",
  color: "inherit",
  ${typographyProps(typography.reference)},
  "::placeholder": {
    color: ${placeholderColor.reference},
  },
});

export const autocompleteChips = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: ${tagGap.reference},
});

export const autocompleteChip = style({
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  gap: ${tagGap.reference},
  color: ${tagColor.reference},
  backgroundColor: ${tagBackgroundColor.reference},
  borderRadius: ${tagBorderRadius.reference},
  paddingLeft: ${itemHorizontalSpacing.reference},
  paddingRight: ${itemHorizontalSpacing.reference},
  ${typographyProps(tagTypography.reference)},
});

export const autocompleteChipRemove = style({
  display: "inline-flex",
  alignItems: "center",
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: "inherit",
});

export const autocompleteTriggerIcons = style({
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
  gap: ${iconSize.reference},
});

export const autocompleteIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: ${iconSize.reference},
  height: ${iconSize.reference},
});

export const autocompleteClear = style({
  display: "inline-flex",
  flexShrink: 0,
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: "inherit",
});

export const autocompletePositioner = style({
  outline: "none",
  zIndex: 50,
  selectors: {
    '&[data-side="top"]': { marginBottom: ${popupOffset.reference} },
    '&[data-side="bottom"]': { marginTop: ${popupOffset.reference} },
    '&[data-side="left"]': { marginRight: ${popupOffset.reference} },
    '&[data-side="right"]': { marginLeft: ${popupOffset.reference} },
  },
});

export const autocompletePopup = style({
  boxSizing: "border-box",
  backgroundColor: ${popupBackgroundColor.reference},
  border: ${popupBorder.reference},
  borderRadius: ${popupBorderRadius.reference},
  boxShadow: ${popupShadow.reference},
  padding: ${popupSpacing.reference},
  outline: "none",
  maxHeight: "min(24rem, var(--available-height))",
  overflowY: "auto",
});

export const autocompleteItem = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxSizing: "border-box",
  cursor: "pointer",
  gap: ${iconSize.reference},
  color: ${itemColor.reference},
  paddingLeft: ${itemHorizontalSpacing.reference},
  paddingRight: ${itemHorizontalSpacing.reference},
  paddingTop: ${itemVerticalSpacing.reference},
  paddingBottom: ${itemVerticalSpacing.reference},
  ${typographyProps(itemTypography.reference)},
  selectors: {
    "&[data-highlighted]": {
      backgroundColor: ${itemHoverBackgroundColor.reference},
    },
    "&[data-selected]": {
      backgroundColor: ${itemSelectedBackgroundColor.reference},
      color: ${itemSelectedColor.reference},
    },
    "&[data-disabled]": {
      color: ${itemDisabledColor.reference},
      cursor: "not-allowed",
    },
  },
});

export const autocompleteItemStart = style({
  display: "inline-flex",
  alignItems: "center",
  gap: ${iconSize.reference},
  overflow: "hidden",
});

export const autocompleteHighlight = style({
  backgroundColor: ${highlightColor.reference},
});

export const autocompleteEmpty = style({
  boxSizing: "border-box",
  color: ${emptyStateColor.reference},
  padding: ${emptyStateSpacing.reference},
  ${typographyProps(emptyStateTypography.reference)},
});
`,
    component: `import type { ReactNode } from "react";
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

const SelectedIcon = icons[${JSON.stringify(selectedIcon)}];
const ClearIcon = icons[${JSON.stringify(clearIcon)}];
const SearchIcon = icons[${JSON.stringify(searchIcon)}];

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
`,
  };
}
