import type { ReactNode } from "react";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { toggleOption, toggleOptionSize, toggleRoot } from "./Toggle.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";

export type ToggleSize = "md";

export interface ToggleOption<Value extends string> {
  value: Value;
  label: ReactNode;
}

export interface ToggleProps<Value extends string> extends CommonComponentProps {
  options: readonly [ToggleOption<Value>, ToggleOption<Value>];
  value?: Value;
  defaultValue?: Value;
  onValueChange?: (value: Value) => void;
  disabled?: boolean;
  size?: ToggleSize;
  render?: RenderProp<"div">;
}

export function Toggle<Value extends string>({
  options,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  size = "md",
  className,
  render,
  ...props
}: ToggleProps<Value>) {
  const classes = [toggleRoot, className].filter(Boolean).join(" ");

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
      data-slot="toggle"
    >
      {options.map((option) => (
        <BaseToggle
          key={option.value}
          value={option.value}
          className={[toggleOption, toggleOptionSize[size]].join(" ")}
        >
          {option.label}
        </BaseToggle>
      ))}
    </BaseToggleGroup>
  );
}
