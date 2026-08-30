import { Button as BaseButton } from "@base-ui/react/button";
import {
  iconButtonIconSize,
  iconButtonLoading,
  iconButtonRoot,
  iconButtonSize,
  iconButtonVariant,
} from "./IconButton.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";
import type { MouseEventHandler } from "react";

export type IconButtonVariant = "primary" | "secondary";
export type IconButtonSize = "sm" | "md";

export interface IconButtonProps extends CommonComponentProps {
  icon: IconType;
  /** Accessible name — mandatory, since there is no visible text. */
  label: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  render?: RenderProp<"button">;
}

export function IconButton({
  icon,
  label,
  type = "button",
  disabled = false,
  onClick,
  variant = "primary",
  size = "sm",
  loading = false,
  className,
  render,
  ...props
}: IconButtonProps) {
  const Icon = icons[icon];

  const classes = [
    iconButtonRoot,
    iconButtonVariant[variant],
    iconButtonSize[size],
    loading && iconButtonLoading,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <BaseButton
      {...props}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      render={render}
      className={classes}
      aria-label={label}
      data-slot="icon-button"
      data-loading={loading || undefined}
    >
      <Icon className={iconButtonIconSize[size]} aria-hidden="true" />
    </BaseButton>
  );
}
