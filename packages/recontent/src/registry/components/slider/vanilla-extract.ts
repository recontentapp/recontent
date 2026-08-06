import type { ComponentSourceFiles, TokenImport } from "../../types.js";

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

export function generateSliderSources(bindings: {
  trackBackgroundColor: TokenImport;
  trackHeight: TokenImport;
  borderRadius: TokenImport;
  indicatorBackgroundColor: TokenImport;
  thumbSize: TokenImport;
  thumbBackgroundColor: TokenImport;
  thumbBorder: TokenImport;
  thumbShadow: TokenImport;
  hoverThumbBackgroundColor: TokenImport;
  focusRingColor: TokenImport;
  disabledTrackBackgroundColor: TokenImport;
  disabledThumbBackgroundColor: TokenImport;
  markColor: TokenImport;
  markTypography: TokenImport;
  valueLabelTypography: TokenImport;
  valueLabelColor: TokenImport;
  valueLabelBackgroundColor: TokenImport;
}): ComponentSourceFiles {
  const {
    trackBackgroundColor,
    trackHeight,
    borderRadius,
    indicatorBackgroundColor,
    thumbSize,
    thumbBackgroundColor,
    thumbBorder,
    thumbShadow,
    hoverThumbBackgroundColor,
    focusRingColor,
    disabledTrackBackgroundColor,
    disabledThumbBackgroundColor,
    markColor,
    markTypography,
    valueLabelTypography,
    valueLabelColor,
    valueLabelBackgroundColor,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const sliderRoot = style({
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  position: "relative",
  touchAction: "none",
  selectors: {
    "&[data-disabled]": {
      cursor: "not-allowed",
    },
  },
});

export const sliderControl = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  boxSizing: "border-box",
  height: ${thumbSize.reference},
  selectors: {
    '&[data-orientation="vertical"]': {
      flexDirection: "column",
      width: ${thumbSize.reference},
      height: "100%",
    },
  },
});

export const sliderTrack = style({
  position: "relative",
  width: "100%",
  height: ${trackHeight.reference},
  borderRadius: ${borderRadius.reference},
  backgroundColor: ${trackBackgroundColor.reference},
  selectors: {
    '[data-orientation="vertical"] &': {
      width: ${trackHeight.reference},
      height: "100%",
    },
    "[data-disabled] &": {
      backgroundColor: ${disabledTrackBackgroundColor.reference},
    },
  },
});

export const sliderIndicator = style({
  position: "absolute",
  borderRadius: ${borderRadius.reference},
  backgroundColor: ${indicatorBackgroundColor.reference},
  selectors: {
    '[data-orientation="horizontal"] &': { height: "100%" },
    '[data-orientation="vertical"] &': { width: "100%" },
  },
});

export const sliderThumb = style({
  boxSizing: "border-box",
  width: ${thumbSize.reference},
  height: ${thumbSize.reference},
  borderRadius: "50%",
  border: ${thumbBorder.reference},
  backgroundColor: ${thumbBackgroundColor.reference},
  boxShadow: ${thumbShadow.reference},
  ":hover": {
    backgroundColor: ${hoverThumbBackgroundColor.reference},
  },
  ":focus-visible": {
    outline: \`2px solid \${${focusRingColor.reference}}\`,
    outlineOffset: "2px",
  },
  selectors: {
    "&[data-disabled]": {
      backgroundColor: ${disabledThumbBackgroundColor.reference},
    },
  },
});

export const sliderMarks = style({
  position: "relative",
  width: "100%",
});

export const sliderMark = style({
  position: "absolute",
  transform: "translateX(-50%)",
  color: ${markColor.reference},
  ${typographyProps(markTypography.reference)},
});

export const sliderValueLabel = style({
  position: "absolute",
  bottom: "100%",
  left: "50%",
  transform: "translateX(-50%)",
  marginBottom: "0.5rem",
  boxSizing: "border-box",
  whiteSpace: "nowrap",
  color: ${valueLabelColor.reference},
  backgroundColor: ${valueLabelBackgroundColor.reference},
  borderRadius: ${borderRadius.reference},
  paddingLeft: "0.375rem",
  paddingRight: "0.375rem",
  paddingTop: "0.125rem",
  paddingBottom: "0.125rem",
  ${typographyProps(valueLabelTypography.reference)},
});
`,
    component: `import { Slider as BaseSlider } from "@base-ui/react/slider";
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
              style={{ left: \`\${((mark.value - min) / (max - min)) * 100}%\` }}
            >
              {mark.label}
            </span>
          ))}
        </div>
      )}
    </BaseSlider.Root>
  );
}
`,
  };
}
