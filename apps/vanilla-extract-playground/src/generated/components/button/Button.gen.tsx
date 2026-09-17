import type { CSSProperties, ReactElement, ReactNode, MouseEventHandler } from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { buttonLoading, buttonRoot, buttonSize, buttonVariant } from "./Button.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";

export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "sm" | "md";

/** Structural sizing, not covered by tokens. */
export type Width = "100%" | "auto" | number | (string & {});

export interface ButtonProps extends CommonComponentProps {
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  startContent?: ReactElement;
  endContent?: ReactElement;
  loading?: boolean;
  disabled?: boolean;
  name?: string;
  value?: string;
  width?: Width;
  children?: ReactNode;
  render?: RenderProp<"button">;
}

export function Button({
  type = "button",
  onClick,
  variant = "primary",
  size = "sm",
  startContent,
  endContent,
  loading = false,
  disabled = false,
  name,
  value,
  width,
  className,
  render,
  children,
  ...props
}: ButtonProps) {
  const classes = [
    buttonRoot,
    buttonVariant[variant],
    buttonSize[size],
    loading && buttonLoading,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties = { width };

  return (
    <BaseButton
      {...props}
      type={type}
      onClick={onClick}
      name={name}
      value={value}
      disabled={disabled || loading}
      render={render}
      className={classes}
      style={style}
      data-slot="button"
      data-loading={loading || undefined}
    >
      {startContent}
      {children}
      {endContent}
    </BaseButton>
  );
}
