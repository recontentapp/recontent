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

export function generateSelectSources(bindings: {
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
  itemSelectedBackgroundColor: TokenImport;
  itemSelectedColor: TokenImport;
  itemDisabledColor: TokenImport;
  itemHorizontalSpacing: TokenImport;
  itemVerticalSpacing: TokenImport;
  /** Build-time config, baked directly into the generated component. */
  indicatorIcon: string;
  selectedIcon: string;
  clearIcon: string;
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
    indicatorIcon,
    selectedIcon,
    clearIcon,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const selectTrigger = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxSizing: "border-box",
  width: "100%",
  cursor: "pointer",
  gap: ${iconSize.reference},
  color: ${color.reference},
  border: ${border.reference},
  borderRadius: ${borderRadius.reference},
  backgroundColor: ${backgroundColor.reference},
  paddingLeft: ${horizontalSpacing.reference},
  paddingRight: ${horizontalSpacing.reference},
  paddingTop: ${verticalSpacing.reference},
  paddingBottom: ${verticalSpacing.reference},
  ${typographyProps(typography.reference)},
  ":hover": {
    borderColor: ${hoverBorderColor.reference},
  },
  ${focusRingBlock(focusRingColor)}
  selectors: {
    "&[data-popup-open]": {
      borderColor: ${focusBorderColor.reference},
    },
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

export const selectValue = style({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const selectPlaceholder = style({
  color: ${placeholderColor.reference},
});

export const selectTriggerIcons = style({
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
  gap: ${iconSize.reference},
});

export const selectIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: ${iconSize.reference},
  height: ${iconSize.reference},
});

export const selectClear = style({
  display: "inline-flex",
  flexShrink: 0,
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: "inherit",
});

export const selectPositioner = style({
  outline: "none",
  zIndex: 50,
  selectors: {
    '&[data-side="top"]': { marginBottom: ${popupOffset.reference} },
    '&[data-side="bottom"]': { marginTop: ${popupOffset.reference} },
    '&[data-side="left"]': { marginRight: ${popupOffset.reference} },
    '&[data-side="right"]': { marginLeft: ${popupOffset.reference} },
  },
});

export const selectPopup = style({
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

export const selectItem = style({
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

export const selectItemStart = style({
  display: "inline-flex",
  alignItems: "center",
  gap: ${iconSize.reference},
  overflow: "hidden",
});
`,
    component: `import type { ReactNode } from "react";
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

const IndicatorIcon = icons[${JSON.stringify(indicatorIcon)}];
const SelectedIcon = icons[${JSON.stringify(selectedIcon)}];
const ClearIcon = icons[${JSON.stringify(clearIcon)}];

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
`,
  };
}
