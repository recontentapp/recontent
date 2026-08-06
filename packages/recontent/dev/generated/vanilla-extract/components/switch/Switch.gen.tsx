import type { ReactNode } from "react";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import {
  switchLabel,
  switchRoot,
  switchRootLabelPosition,
  switchThumb,
  switchThumbSize,
  switchTrack,
  switchTrackSize,
} from "./Switch.gen.css";
import type { CommonComponentProps, FieldableInputProps, RenderProp } from "../../renderElement.gen";

export type SwitchSize = "sm" | "md";

export interface SwitchProps extends CommonComponentProps, FieldableInputProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode;
  labelPosition?: "start" | "end";
  size?: SwitchSize;
  render?: RenderProp<"button">;
}

export function Switch({
  checked,
  defaultChecked,
  onCheckedChange,
  label,
  labelPosition = "end",
  size = "sm",
  name,
  disabled = false,
  required = false,
  invalid = false,
  onFocus,
  onBlur,
  className,
  render,
  ...props
}: SwitchProps) {
  const classes = [switchRoot, switchRootLabelPosition[labelPosition], className]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={classes} data-disabled={disabled || undefined} data-slot="switch">
      <BaseSwitch.Root
        {...props}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={(next) => onCheckedChange?.(next)}
        name={name}
        disabled={disabled}
        required={required}
        onFocus={onFocus}
        onBlur={onBlur}
        data-invalid={invalid || undefined}
        render={render}
        className={[switchTrack, switchTrackSize[size]].join(" ")}
      >
        <BaseSwitch.Thumb className={[switchThumb, switchThumbSize[size]].join(" ")} />
      </BaseSwitch.Root>
      {label !== undefined && <span className={switchLabel}>{label}</span>}
    </label>
  );
}
