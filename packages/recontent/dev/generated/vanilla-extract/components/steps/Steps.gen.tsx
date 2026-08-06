import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  stepsConnector,
  stepsConnectorStatus,
  stepsContent,
  stepsDescription,
  stepsIndicator,
  stepsIndicatorRow,
  stepsIndicatorSize,
  stepsIndicatorStatus,
  stepsLabel,
  stepsLabelStatus,
  stepsRoot,
  stepsRootSize,
  stepsStep,
} from "./Steps.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { icons } from "../../iconMap";

const CompleteIcon = icons["check"];
const ErrorIcon = icons["alert"];

export type StepsSize = "sm" | "md";
export type StepStatus = "complete" | "current" | "upcoming" | "error";

export interface Step {
  label: ReactNode;
  description?: ReactNode;
  status?: StepStatus;
}

export interface StepsProps extends CommonComponentProps {
  steps: Step[];
  /** Derives each step's status when `Step.status` is omitted. */
  activeStep?: number;
  orientation?: "horizontal" | "vertical";
  size?: StepsSize;
  render?: RenderProp<"ol">;
}

function deriveStatus(index: number, activeStep: number): StepStatus {
  if (index < activeStep) return "complete";
  if (index === activeStep) return "current";
  return "upcoming";
}

export function Steps({
  steps,
  activeStep = 0,
  orientation = "horizontal",
  size = "sm",
  className,
  render,
  ...props
}: StepsProps) {
  const classes = [stepsRoot, stepsRootSize[size], className].filter(Boolean).join(" ");

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "steps",
    "data-orientation": orientation,
    className: classes,
    children: steps.map((step, index) => {
      const status = step.status ?? deriveStatus(index, activeStep);
      const isLast = index === steps.length - 1;

      return (
        <li key={index} className={stepsStep} data-orientation={orientation}>
          <span className={stepsIndicatorRow} data-orientation={orientation}>
            <span
              className={[stepsIndicator, stepsIndicatorSize[size], stepsIndicatorStatus[status]].join(" ")}
            >
              {status === "complete" && <CompleteIcon aria-hidden="true" />}
              {status === "error" && <ErrorIcon aria-hidden="true" />}
              {status !== "complete" && status !== "error" && index + 1}
            </span>
            {!isLast && (
              <span
                className={[stepsConnector, stepsConnectorStatus[status]].join(" ")}
                data-orientation={orientation}
                aria-hidden="true"
              />
            )}
          </span>
          <span className={stepsContent}>
            <p className={[stepsLabel, stepsLabelStatus[status]].join(" ")}>{step.label}</p>
            {step.description !== undefined && <p className={stepsDescription}>{step.description}</p>}
          </span>
        </li>
      );
    }),
  };

  return renderElement("ol", render, rootProps as ComponentPropsWithoutRef<"ol">);
}
