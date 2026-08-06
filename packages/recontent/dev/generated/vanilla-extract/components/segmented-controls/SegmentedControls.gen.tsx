import type { CSSProperties, ReactNode } from "react";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import {
  segmentedControlsOption,
  segmentedControlsOptionIcon,
  segmentedControlsRoot,
} from "./SegmentedControls.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";

/** Structural sizing, not covered by tokens. */
export type Width = "100%" | "auto" | number | (string & {});

export interface SegmentedControlsOption<Value extends string> {
  value: Value;
  label: ReactNode;
  icon?: IconType;
  disabled?: boolean;
}

export interface SegmentedControlsProps<Value extends string> extends CommonComponentProps {
  options: SegmentedControlsOption<Value>[];
  value?: Value;
  defaultValue?: Value;
  onValueChange?: (value: Value) => void;
  disabled?: boolean;
  width?: Width;
  render?: RenderProp<"div">;
}

export function SegmentedControls<Value extends string>({
  options,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  width,
  className,
  render,
  ...props
}: SegmentedControlsProps<Value>) {
  const classes = [segmentedControlsRoot, className].filter(Boolean).join(" ");
  const style: CSSProperties = { width };

  return (
    <BaseToggleGroup
      {...props}
      value={value !== undefined ? [value] : undefined}
      defaultValue={defaultValue !== undefined ? [defaultValue] : undefined}
      onValueChange={(groupValue) => onValueChange?.(groupValue[0] as Value)}
      disabled={disabled}
      multiple={false}
      render={render}
      className={classes}
      style={style}
      data-slot="segmented-controls"
    >
      {options.map((option) => {
        const OptionIcon = option.icon ? icons[option.icon] : undefined;
        return (
          <BaseToggle
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={segmentedControlsOption}
          >
            {OptionIcon && <OptionIcon className={segmentedControlsOptionIcon} aria-hidden="true" />}
            {option.label}
          </BaseToggle>
        );
      })}
    </BaseToggleGroup>
  );
}
