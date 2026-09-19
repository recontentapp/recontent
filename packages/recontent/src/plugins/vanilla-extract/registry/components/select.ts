import type { ComponentSourceFiles, TokenImport } from "../types.js";
import { focusRingBlock } from "./shared.js";

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

import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import type { IconName } from "../internal/icon-map-icons.js";
import { vanillaExtractComponentOutput } from "./shared.js";

export type SelectComponentOptions = {
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
  itemSelectedBackgroundColor: TokenBinding<"color">;
  itemSelectedColor: TokenBinding<"color">;
  itemDisabledColor: TokenBinding<"color">;
  itemHorizontalSpacing: TokenBinding<"dimension">;
  itemVerticalSpacing: TokenBinding<"dimension">;
  indicatorIcon: IconName;
  selectedIcon: IconName;
  clearIcon: IconName;
};

export const selectComponent = defineRegistryComponent<SelectComponentOptions>()({
  id: "select",
  name: "Select",
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
    color: { kind: "token", type: "color", description: "Text color of the selected value." },
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to the trigger.",
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
    itemSelectedBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the selected item.",
    },
    itemSelectedColor: {
      kind: "token",
      type: "color",
      description: "Text color of the selected item.",
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
    indicatorIcon: { kind: "icon", description: "Icon rendered at the end of the trigger." },
    selectedIcon: { kind: "icon", description: "Icon marking the selected item." },
    clearIcon: { kind: "icon", description: "Icon used by the clear button." },
  },
  output: vanillaExtractComponentOutput(
    "select",
    "Select",
    (_scales, _breakpoints, tokens, focusRingColor, icons) =>
      generateSelectSources({
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
        itemSelectedBackgroundColor: tokens.itemSelectedBackgroundColor!,
        itemSelectedColor: tokens.itemSelectedColor!,
        itemDisabledColor: tokens.itemDisabledColor!,
        itemHorizontalSpacing: tokens.itemHorizontalSpacing!,
        itemVerticalSpacing: tokens.itemVerticalSpacing!,
        indicatorIcon: icons.indicatorIcon!,
        selectedIcon: icons.selectedIcon!,
        clearIcon: icons.clearIcon!,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
