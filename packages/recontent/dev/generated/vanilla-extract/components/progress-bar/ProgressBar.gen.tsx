import { Progress as BaseProgress } from "@base-ui/react/progress";
import type { ReactNode } from "react";
import {
  progressBarIndicator,
  progressBarIndicatorStatus,
  progressBarLabelRow,
  progressBarLabelStatus,
  progressBarRoot,
  progressBarTrack,
  progressBarTrackSize,
} from "./ProgressBar.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";

export type ProgressBarStatusToken = "default" | "success" | "danger";
export type ProgressBarSize = "sm" | "md";

export interface ProgressBarProps extends CommonComponentProps {
  /** `null` renders the indeterminate state. */
  value: number | null;
  min?: number;
  max?: number;
  status?: ProgressBarStatusToken;
  size?: ProgressBarSize;
  label?: ReactNode;
  showValueLabel?: boolean;
  formatValueLabel?: (value: number, max: number) => ReactNode;
  render?: RenderProp<"div">;
}

export function ProgressBar({
  value,
  min = 0,
  max = 100,
  status = "default",
  size = "sm",
  label,
  showValueLabel = false,
  formatValueLabel,
  className,
  render,
  ...props
}: ProgressBarProps) {
  const classes = [progressBarRoot, className].filter(Boolean).join(" ");
  const valueLabel =
    value !== null ? (formatValueLabel ? formatValueLabel(value, max) : `${Math.round(((value - min) / (max - min)) * 100)}%`) : null;

  return (
    <BaseProgress.Root
      {...props}
      value={value}
      min={min}
      max={max}
      render={render}
      className={classes}
      data-slot="progress-bar"
    >
      {(label !== undefined || showValueLabel) && (
        <div className={[progressBarLabelRow, progressBarLabelStatus[status]].join(" ")}>
          {label !== undefined && <BaseProgress.Label>{label}</BaseProgress.Label>}
          {showValueLabel && valueLabel !== null && <span>{valueLabel}</span>}
        </div>
      )}
      <BaseProgress.Track className={[progressBarTrack, progressBarTrackSize[size]].join(" ")}>
        <BaseProgress.Indicator
          className={[progressBarIndicator, progressBarIndicatorStatus[status]].join(" ")}
        />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}
