import type { ComponentSourceFiles, TokenImport } from "../types.js";
import { focusRingBlock, typographyProps } from "./shared.js";
import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import type { IconName } from "../internal/icon-map-icons.js";
import { vanillaExtractComponentOutput } from "./shared.js";
function generateAutocompleteSources(bindings: {
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
  ${typographyProps(typography.reference, "      ")},
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
  ${typographyProps(itemTypography.reference, "      ")},
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
  ${typographyProps(emptyStateTypography.reference, "      ")},
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

export type AutocompleteComponentOptions = {
  // Trigger/popup surface, shared with Select.
  borderRadius: TokenBinding<"dimension">;
  border: TokenBinding<"border">;
  backgroundColor: TokenBinding<"color">;
  color: TokenBinding<"color">;
  typography: TokenBinding<"typography">;
  placeholderColor: TokenBinding<"color">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  hoverBorderColor: TokenBinding<"color">;
  focusBorderColor: TokenBinding<"color">;
  invalidBorderColor: TokenBinding<"color">;
  disabledBackgroundColor: TokenBinding<"color">;
  disabledColor: TokenBinding<"color">;
  iconSize: TokenBinding<"dimension">;
  popupBackgroundColor: TokenBinding<"color">;
  popupBorder: TokenBinding<"border">;
  popupBorderRadius: TokenBinding<"dimension">;
  popupShadow: TokenBinding<"shadow">;
  popupSpacing: TokenBinding<"dimension">;
  popupOffset: TokenBinding<"dimension">;
  itemColor: TokenBinding<"color">;
  itemTypography: TokenBinding<"typography">;
  itemHoverBackgroundColor: TokenBinding<"color">;
  itemDisabledColor: TokenBinding<"color">;
  itemHorizontalSpacing: TokenBinding<"dimension">;
  itemVerticalSpacing: TokenBinding<"dimension">;
  // Autocomplete-specific.
  gap: TokenBinding<"dimension">;
  emptyStateColor: TokenBinding<"color">;
  emptyStateTypography: TokenBinding<"typography">;
  emptyStateSpacing: TokenBinding<"dimension">;
  highlightColor: TokenBinding<"color">;
  clearIcon: IconName;
  searchIcon: IconName;
};

export const autocompleteComponent = defineRegistryComponent<AutocompleteComponentOptions>()({
  id: "autocomplete",
  name: "Autocomplete",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius of the trigger.",
    },
    border: { kind: "token", type: "border", description: "Border applied around the trigger." },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the trigger.",
    },
    color: { kind: "token", type: "color", description: "Text color of the input." },
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to the input.",
    },
    placeholderColor: {
      kind: "token",
      type: "color",
      description: "Text color of the placeholder.",
    },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the trigger.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the trigger.",
    },
    hoverBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the trigger on hover.",
    },
    focusBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the trigger on focus.",
    },
    invalidBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the trigger when invalid.",
    },
    disabledBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the trigger when disabled.",
    },
    disabledColor: {
      kind: "token",
      type: "color",
      description: "Text color of the trigger when disabled.",
    },
    iconSize: { kind: "token", type: "dimension", description: "Size of the trigger/item icons." },
    popupBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the popup.",
    },
    popupBorder: { kind: "token", type: "border", description: "Border applied around the popup." },
    popupBorderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius of the popup.",
    },
    popupShadow: { kind: "token", type: "shadow", description: "Shadow applied to the popup." },
    popupSpacing: {
      kind: "token",
      type: "dimension",
      description: "Padding around the item list.",
    },
    popupOffset: {
      kind: "token",
      type: "dimension",
      description: "Gap between the trigger and the popup.",
    },
    itemColor: { kind: "token", type: "color", description: "Text color of an item." },
    itemTypography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to an item.",
    },
    itemHoverBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of a highlighted item.",
    },
    itemDisabledColor: {
      kind: "token",
      type: "color",
      description: "Text color of a disabled item.",
    },
    itemHorizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of an item.",
    },
    itemVerticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of an item.",
    },
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between the search icon, input and clear button in the trigger.",
    },
    emptyStateColor: {
      kind: "token",
      type: "color",
      description: "Text color of the empty state.",
    },
    emptyStateTypography: {
      kind: "token",
      type: "typography",
      description: "Typography of the empty state.",
    },
    emptyStateSpacing: {
      kind: "token",
      type: "dimension",
      description: "Padding around the empty state.",
    },
    highlightColor: {
      kind: "token",
      type: "color",
      description: "Background color behind a matched substring in an option's label.",
    },
    clearIcon: { kind: "icon", description: "Icon used by the clear button." },
    searchIcon: { kind: "icon", description: "Icon used by the search input." },
  },
  output: vanillaExtractComponentOutput(
    "autocomplete",
    "Autocomplete",
    (_scales, _breakpoints, tokens, focusRingColor, icons) =>
      generateAutocompleteSources({
        borderRadius: tokens.borderRadius!,
        border: tokens.border!,
        backgroundColor: tokens.backgroundColor!,
        color: tokens.color!,
        typography: tokens.typography!,
        placeholderColor: tokens.placeholderColor!,
        horizontalSpacing: tokens.horizontalSpacing!,
        verticalSpacing: tokens.verticalSpacing!,
        hoverBorderColor: tokens.hoverBorderColor!,
        focusBorderColor: tokens.focusBorderColor!,
        focusRingColor,
        invalidBorderColor: tokens.invalidBorderColor!,
        disabledBackgroundColor: tokens.disabledBackgroundColor!,
        disabledColor: tokens.disabledColor!,
        iconSize: tokens.iconSize!,
        popupBackgroundColor: tokens.popupBackgroundColor!,
        popupBorder: tokens.popupBorder!,
        popupBorderRadius: tokens.popupBorderRadius!,
        popupShadow: tokens.popupShadow!,
        popupSpacing: tokens.popupSpacing!,
        popupOffset: tokens.popupOffset!,
        itemColor: tokens.itemColor!,
        itemTypography: tokens.itemTypography!,
        itemHoverBackgroundColor: tokens.itemHoverBackgroundColor!,
        itemDisabledColor: tokens.itemDisabledColor!,
        itemHorizontalSpacing: tokens.itemHorizontalSpacing!,
        itemVerticalSpacing: tokens.itemVerticalSpacing!,
        gap: tokens.gap!,
        emptyStateColor: tokens.emptyStateColor!,
        emptyStateTypography: tokens.emptyStateTypography!,
        emptyStateSpacing: tokens.emptyStateSpacing!,
        highlightColor: tokens.highlightColor!,
        clearIcon: icons.clearIcon!,
        searchIcon: icons.searchIcon!,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
