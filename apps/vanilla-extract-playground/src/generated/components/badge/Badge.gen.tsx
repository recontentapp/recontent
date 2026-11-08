import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { badgeIconSize, badgeRoot, badgeSize, badgeVariant } from "./Badge.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";

export type BadgeStatusToken = "info" | "success" | "warning" | "danger";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends CommonComponentProps {
  variant?: BadgeStatusToken;
  size?: BadgeSize;
  icon?: IconType;
  children?: ReactNode;
  render?: RenderProp<"span">;
}

/**
 * Small label conveying a status or a count.
 *
 * @usage Use to flag the state of an item next to its name. For an inline message with actions, use
 * {@link Banner}.
 *
 * @example
 * <Badge variant="success">Active</Badge>
 *
 * @category Data display
 */
export function Badge({
  variant = "info",
  size = "sm",
  icon,
  className,
  render,
  children,
  ...props
}: BadgeProps) {
  const Icon = icon ? icons[icon] : undefined;

  const classes = [badgeRoot, badgeVariant[variant], badgeSize[size], className]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {Icon && <Icon className={badgeIconSize[size]} aria-hidden="true" />}
      {children}
    </>
  );

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "badge",
    className: classes,
    children: content,
  };

  return renderElement("span", render, rootProps as ComponentPropsWithoutRef<"span">);
}
