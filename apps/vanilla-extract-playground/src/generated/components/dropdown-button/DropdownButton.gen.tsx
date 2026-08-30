import type { ReactNode } from "react";
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

const IndicatorIcon = icons["chevronDown"];

export type DropdownButtonVariant = "primary" | "secondary";
export type DropdownButtonSize = "sm" | "md";

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
  variant = "primary",
  size = "sm",
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
