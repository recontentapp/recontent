import type { CSSProperties } from "react";
import { iconColor, iconRoot, iconSize } from "./Icon.gen.css";
import type { RefIconScale as IconSizeToken, SystemColorsTextScale as IconColorToken } from "../../tokens.css";
import type { CommonComponentProps } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";

export interface IconProps extends CommonComponentProps {
  icon: IconType;
  size?: IconSizeToken | number;
  color?: IconColorToken;
  label?: string;
}

export function Icon({ icon, size, color, label, className, ...props }: IconProps) {
  const Component = icons[icon];

  const classes = [
    iconRoot,
    typeof size === "string" && iconSize[size],
    color !== undefined && iconColor[color],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties =
    typeof size === "number" ? { width: size, height: size } : {};

  const accessibilityProps = label
    ? { role: "img" as const, "aria-label": label }
    : { "aria-hidden": true as const };

  return (
    <Component
      {...props}
      {...accessibilityProps}
      data-slot="icon"
      className={classes}
      style={style}
    />
  );
}
