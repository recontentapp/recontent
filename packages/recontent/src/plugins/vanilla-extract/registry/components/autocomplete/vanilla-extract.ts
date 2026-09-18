import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { focusRingBlock } from "../shared.js";

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
  focusRingColor: TokenImport | undefined;
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
  itemDisabledColor: TokenImport;
  itemHorizontalSpacing: TokenImport;
  itemVerticalSpacing: TokenImport;
  gap: TokenImport;
  emptyStateColor: TokenImport;
  emptyStateTypography: TokenImport;
  emptyStateSpacing: TokenImport;
  highlightColor: TokenImport;
  /** Build-time config, baked directly into the generated component. */
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
    itemDisabledColor,
    itemHorizontalSpacing,
    itemVerticalSpacing,
    gap,
    emptyStateColor,
    emptyStateTypography,
    emptyStateSpacing,
    highlightColor,
    clearIcon,
    searchIcon,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const autocompleteTrigger = style({
  display: "flex",
  alignItems: "center",
  boxSizing: "border-box",
  width: "100%",
  gap: ${gap.reference},
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
    ${focusRingBlock(focusRingColor, { selector: "&:focus-within" })}
  },
});

export const autocompleteInput = style({
  flex: 1,
  minWidth: 0,
  border: "none",
  outline: "none",
  background: "none",
  color: "inherit",
  ${typographyProps(typography.reference)},
  "::placeholder": {
    color: ${placeholderColor.reference},
  },
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
  width: "var(--anchor-width)",
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
  outline: "none",
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
    component: `import { useRef, type ReactNode } from "react";
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

const ClearIcon = icons[${JSON.stringify(clearIcon)}];
const SearchIcon = icons[${JSON.stringify(searchIcon)}];

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
`,
  };
}
