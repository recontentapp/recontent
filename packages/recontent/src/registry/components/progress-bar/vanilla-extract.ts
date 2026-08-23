import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { groupVariantTokens } from "../shared.js";

const STATUS_FIELDS = ["indicatorBackgroundColor", "labelColor"] as const;
const SIZE_FIELDS = ["height", "typography"] as const;

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

function statusIndicatorStyleBody(fields: Record<string, TokenImport>): string {
  return `{ backgroundColor: ${fields.indicatorBackgroundColor!.reference} }`;
}

function statusLabelStyleBody(fields: Record<string, TokenImport>): string {
  return `{ color: ${fields.labelColor!.reference} }`;
}

function sizeTrackStyleBody(fields: Record<string, TokenImport>): string {
  return `{ height: ${fields.height!.reference} }`;
}

export function generateProgressBarSources(bindings: {
  borderRadius: TokenImport;
  trackBackgroundColor: TokenImport;
  labelTypography: TokenImport;
  labelGap: TokenImport;
  animationDuration: TokenImport;
  tokens: Record<string, TokenImport>;
}): ComponentSourceFiles {
  const {
    borderRadius,
    trackBackgroundColor,
    labelTypography,
    labelGap,
    animationDuration,
    tokens,
  } = bindings;
  const statuses = groupVariantTokens(tokens, "statuses", STATUS_FIELDS);
  const sizes = groupVariantTokens(tokens, "sizes", SIZE_FIELDS);

  const statusNames = Object.keys(statuses);
  const sizeNames = Object.keys(sizes);

  return {
    styles: `import { keyframes, style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

const indeterminateSweep = keyframes({
  "0%": { transform: "translateX(-100%)" },
  "100%": { transform: "translateX(300%)" },
});

export const progressBarRoot = style({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  gap: ${labelGap.reference},
});

export const progressBarLabelRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: ${labelGap.reference},
  ${typographyProps(labelTypography.reference)},
});

export const progressBarLabelStatus = styleVariants({
${statusNames.map((name) => `  ${JSON.stringify(name)}: ${statusLabelStyleBody(statuses[name]!)},`).join("\n")}
});

export const progressBarTrack = style({
  boxSizing: "border-box",
  overflow: "hidden",
  position: "relative",
  width: "100%",
  borderRadius: ${borderRadius.reference},
  backgroundColor: ${trackBackgroundColor.reference},
});

export const progressBarTrackSize = styleVariants({
${sizeNames.map((name) => `  ${JSON.stringify(name)}: ${sizeTrackStyleBody(sizes[name]!)},`).join("\n")}
});

export const progressBarIndicator = style({
  height: "100%",
  boxSizing: "border-box",
  borderRadius: ${borderRadius.reference},
  transitionProperty: "width",
  transitionDuration: "200ms",
  selectors: {
    "[data-indeterminate] &": {
      width: "25% !important",
      animationName: indeterminateSweep,
      animationDuration: ${animationDuration.reference},
      animationIterationCount: "infinite",
      animationTimingFunction: "ease-in-out",
    },
  },
});

export const progressBarIndicatorStatus = styleVariants({
${statusNames.map((name) => `  ${JSON.stringify(name)}: ${statusIndicatorStyleBody(statuses[name]!)},`).join("\n")}
});
`,
    component: `import { Progress as BaseProgress } from "@base-ui/react/progress";
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

export type ProgressBarStatusToken = ${statusNames.map((n) => JSON.stringify(n)).join(" | ")};
export type ProgressBarSize = ${sizeNames.map((n) => JSON.stringify(n)).join(" | ")};

export interface ProgressBarProps extends CommonComponentProps {
  /** \`null\` renders the indeterminate state. */
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
  status = ${JSON.stringify(statusNames[0] ?? "default")},
  size = ${JSON.stringify(sizeNames[0] ?? "md")},
  label,
  showValueLabel = false,
  formatValueLabel,
  className,
  render,
  ...props
}: ProgressBarProps) {
  const classes = [progressBarRoot, className].filter(Boolean).join(" ");
  const valueLabel =
    value !== null ? (formatValueLabel ? formatValueLabel(value, max) : \`\${Math.round(((value - min) / (max - min)) * 100)}%\`) : null;

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
`,
  };
}
