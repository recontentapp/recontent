import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { badgeDot, badgeDotColor, badgeIconSize, badgeRoot, badgeSize, badgeVariant } from "./Badge.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";

export type BadgeStatusToken = "info" | "success" | "warning" | "danger";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends CommonComponentProps {
  variant?: BadgeStatusToken;
  size?: BadgeSize;
  icon?: IconType;
  dot?: boolean;
  children?: ReactNode;
  render?: RenderProp<"span">;
}

export function Badge({
  variant = "info",
  size = "sm",
  icon,
  dot = false,
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
      {dot && <span className={[badgeDot, badgeDotColor[variant]].join(" ")} aria-hidden="true" />}
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
