import type { CSSProperties, ComponentPropsWithoutRef } from "react";
import { spinnerColor, spinnerRoot, spinnerSize } from "./Spinner.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import type { RefFontSizeScale as SpinnerSizeToken, SystemColorsTextScale as SpinnerColorToken } from "../../tokens.css";

export interface SpinnerProps extends CommonComponentProps {
  size?: SpinnerSizeToken | number;
  color?: SpinnerColorToken;
  /** Accessible label; omit only when an adjacent element already labels it. */
  label?: string;
  render?: RenderProp<"span">;
}

export function Spinner({ size, color, label, className, render, ...props }: SpinnerProps) {
  const classes = [
    spinnerRoot,
    typeof size === "string" && spinnerSize[size],
    color !== undefined && spinnerColor[color],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties = typeof size === "number" ? { width: size, height: size } : {};

  const accessibilityProps = label
    ? { role: "img" as const, "aria-label": label }
    : { "aria-hidden": true as const };

  const rootProps: Record<string, unknown> = {
    ...props,
    ...accessibilityProps,
    "data-slot": "spinner",
    className: classes,
    style,
  };

  return renderElement("span", render, rootProps as ComponentPropsWithoutRef<"span">);
}
