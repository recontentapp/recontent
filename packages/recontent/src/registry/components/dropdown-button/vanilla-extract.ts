import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { groupVariantTokens } from "../shared.js";

const VARIANT_FIELDS = [
  "backgroundColor",
  "color",
  "typography",
  "border",
  "hoverBackgroundColor",
  "hoverColor",
  "hoverBorder",
  "disabledBackgroundColor",
  "disabledColor",
  "disabledBorder",
] as const;

const SIZE_FIELDS = ["horizontalSpacing", "verticalSpacing", "typography", "gap"] as const;

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

function variantStyleBody(fields: Record<string, TokenImport>): string {
  return `{
      backgroundColor: ${fields.backgroundColor!.reference},
      color: ${fields.color!.reference},
      border: ${fields.border!.reference},
      ${typographyProps(fields.typography!.reference)},
      ":hover": {
        backgroundColor: ${fields.hoverBackgroundColor!.reference},
        color: ${fields.hoverColor!.reference},
        border: ${fields.hoverBorder!.reference},
      },
      ":disabled": {
        backgroundColor: ${fields.disabledBackgroundColor!.reference},
        color: ${fields.disabledColor!.reference},
        border: ${fields.disabledBorder!.reference},
        cursor: "not-allowed",
      },
    }`;
}

function sizeStyleBody(fields: Record<string, TokenImport>): string {
  return `{
      paddingLeft: ${fields.horizontalSpacing!.reference},
      paddingRight: ${fields.horizontalSpacing!.reference},
      paddingTop: ${fields.verticalSpacing!.reference},
      paddingBottom: ${fields.verticalSpacing!.reference},
      gap: ${fields.gap!.reference},
      ${typographyProps(fields.typography!.reference)},
    }`;
}

export function generateDropdownButtonSources(bindings: {
  borderRadius: TokenImport;
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
  itemIconSize: TokenImport;
  /** Build-time config, baked directly into the generated component. */
  indicatorIcon: string;
  tokens: Record<string, TokenImport>;
}): ComponentSourceFiles {
  const {
    borderRadius,
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
    itemIconSize,
    indicatorIcon,
    tokens,
  } = bindings;
  const variants = groupVariantTokens(tokens, "variants", VARIANT_FIELDS);
  const sizes = groupVariantTokens(tokens, "sizes", SIZE_FIELDS);

  const variantNames = Object.keys(variants);
  const sizeNames = Object.keys(sizes);

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const dropdownButtonTrigger = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  borderRadius: ${borderRadius.reference},
  ":focus-visible": {
    outline: "2px solid currentColor",
    outlineOffset: "2px",
  },
});

export const dropdownButtonIndicator = style({
  display: "inline-flex",
  flexShrink: 0,
  width: "1em",
  height: "1em",
  selectors: {
    "[data-popup-open] &": { transform: "rotate(180deg)" },
  },
});

export const dropdownButtonVariant = styleVariants({
${variantNames.map((name) => `  ${JSON.stringify(name)}: ${variantStyleBody(variants[name]!)},`).join("\n")}
});

export const dropdownButtonSize = styleVariants({
${sizeNames.map((name) => `  ${JSON.stringify(name)}: ${sizeStyleBody(sizes[name]!)},`).join("\n")}
});

export const dropdownButtonPositioner = style({
  outline: "none",
  zIndex: 50,
  selectors: {
    '&[data-side="top"]': { marginBottom: ${popupOffset.reference} },
    '&[data-side="bottom"]': { marginTop: ${popupOffset.reference} },
    '&[data-side="left"]': { marginRight: ${popupOffset.reference} },
    '&[data-side="right"]': { marginLeft: ${popupOffset.reference} },
  },
});

export const dropdownButtonPopup = style({
  boxSizing: "border-box",
  backgroundColor: ${popupBackgroundColor.reference},
  border: ${popupBorder.reference},
  borderRadius: ${popupBorderRadius.reference},
  boxShadow: ${popupShadow.reference},
  padding: ${popupSpacing.reference},
  outline: "none",
});

export const dropdownButtonItem = style({
  display: "flex",
  alignItems: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  color: ${itemColor.reference},
  gap: "0.5em",
  paddingLeft: ${itemHorizontalSpacing.reference},
  paddingRight: ${itemHorizontalSpacing.reference},
  paddingTop: ${itemVerticalSpacing.reference},
  paddingBottom: ${itemVerticalSpacing.reference},
  ${typographyProps(itemTypography.reference)},
  ":hover": {
    backgroundColor: ${itemHoverBackgroundColor.reference},
  },
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

export const dropdownButtonItemIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: ${itemIconSize.reference},
  height: ${itemIconSize.reference},
});
`,
    component: `import type { ReactNode } from "react";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import {
  dropdownButtonIndicator,
  dropdownButtonItem,
  dropdownButtonItemIcon,
  dropdownButtonPopup,
  dropdownButtonPositioner,
  dropdownButtonSize,
  dropdownButtonTrigger,
  dropdownButtonVariant,
} from "./DropdownButton.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";

const IndicatorIcon = icons[${JSON.stringify(indicatorIcon)}];

export type DropdownButtonVariant = ${variantNames.map((n) => JSON.stringify(n)).join(" | ")};
export type DropdownButtonSize = ${sizeNames.map((n) => JSON.stringify(n)).join(" | ")};

export interface DropdownButtonItem {
  value: string;
  label: ReactNode;
  icon?: IconType;
  disabled?: boolean;
  onSelect?: () => void;
}

export interface DropdownButtonProps extends CommonComponentProps {
  label: ReactNode;
  items: DropdownButtonItem[];
  disabled?: boolean;
  variant?: DropdownButtonVariant;
  size?: DropdownButtonSize;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  render?: RenderProp<"button">;
}

export function DropdownButton({
  label,
  items,
  disabled = false,
  variant = ${JSON.stringify(variantNames[0] ?? "primary")},
  size = ${JSON.stringify(sizeNames[0] ?? "md")},
  align = "start",
  side = "bottom",
  open,
  defaultOpen,
  onOpenChange,
  className,
  render,
  ...props
}: DropdownButtonProps) {
  const classes = [
    dropdownButtonTrigger,
    dropdownButtonVariant[variant],
    dropdownButtonSize[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <BaseMenu.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <BaseMenu.Trigger
        {...props}
        disabled={disabled}
        render={render}
        className={classes}
        data-slot="dropdown-button-trigger"
      >
        {label}
        <IndicatorIcon className={dropdownButtonIndicator} aria-hidden="true" />
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner
          className={dropdownButtonPositioner}
          align={align}
          side={side}
        >
          <BaseMenu.Popup className={dropdownButtonPopup} data-slot="dropdown-button-popup">
            {items.map((item) => {
              const ItemIcon = item.icon ? icons[item.icon] : undefined;
              return (
                <BaseMenu.Item
                  key={item.value}
                  className={dropdownButtonItem}
                  disabled={item.disabled}
                  onClick={item.onSelect}
                >
                  {ItemIcon && <ItemIcon className={dropdownButtonItemIcon} aria-hidden="true" />}
                  {item.label}
                </BaseMenu.Item>
              );
            })}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
`,
  };
}
