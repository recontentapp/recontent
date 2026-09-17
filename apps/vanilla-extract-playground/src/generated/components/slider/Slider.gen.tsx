import { Slider as BaseSlider } from "@base-ui/react/slider";
import type { ReactNode } from "react";
import {
  sliderControl,
  sliderIndicator,
  sliderMark,
  sliderMarks,
  sliderRoot,
  sliderThumb,
  sliderTrack,
  sliderValueLabel,
} from "./Slider.gen.css";
import type { CommonComponentProps, FieldableInputProps, RenderProp } from "../../renderElement.gen";

export interface SliderMark {
  value: number;
  label?: ReactNode;
}

export interface SliderProps extends CommonComponentProps, FieldableInputProps {
  value?: number | number[];
  defaultValue?: number | number[];
  onValueChange?: (value: number | number[]) => void;
  /** Fires once on pointer release — use for expensive commits. */
  onValueCommit?: (value: number | number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  orientation?: "horizontal" | "vertical";
  showValueLabel?: boolean;
  formatValueLabel?: (value: number) => ReactNode;
  marks?: SliderMark[];
  render?: RenderProp<"div">;
}

export function Slider({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  orientation = "horizontal",
  showValueLabel = false,
  formatValueLabel,
  marks,
  name,
  disabled = false,
  required = false,
  invalid = false,
  onFocus,
  onBlur,
  className,
  render,
  ...props
}: SliderProps) {
  const classes = [sliderRoot, className].filter(Boolean).join(" ");
  const values = value ?? defaultValue;
  const thumbCount = Array.isArray(values) ? values.length : 1;

  return (
    <BaseSlider.Root
      {...props}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => onValueChange?.(next)}
      onValueCommitted={(next) => onValueCommit?.(next)}
      min={min}
      max={max}
      step={step}
      orientation={orientation}
      name={name}
      disabled={disabled}
      aria-required={required || undefined}
      data-invalid={invalid || undefined}
      render={render}
      className={classes}
      data-slot="slider"
    >
      <BaseSlider.Control className={sliderControl}>
        <BaseSlider.Track className={sliderTrack}>
          <BaseSlider.Indicator className={sliderIndicator} />
          {Array.from({ length: thumbCount }, (_, index) => (
            <BaseSlider.Thumb
              key={index}
              index={index}
              onFocus={onFocus}
              onBlur={onBlur}
              className={sliderThumb}
            >
              {showValueLabel && (
                <BaseSlider.Value>
                  {(formattedValues, values) => {
                    const raw = values[index];
                    const label = formatValueLabel && raw !== undefined ? formatValueLabel(raw) : formattedValues[index];
                    return <span className={sliderValueLabel}>{label}</span>;
                  }}
                </BaseSlider.Value>
              )}
            </BaseSlider.Thumb>
          ))}
        </BaseSlider.Track>
      </BaseSlider.Control>
      {marks && marks.length > 0 && (
        <div className={sliderMarks}>
          {marks.map((mark) => (
            <span
              key={mark.value}
              className={sliderMark}
              style={{ left: `${((mark.value - min) / (max - min)) * 100}%` }}
            >
              {mark.label}
            </span>
          ))}
        </div>
      )}
    </BaseSlider.Root>
  );
}
