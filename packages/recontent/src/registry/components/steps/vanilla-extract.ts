import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { groupVariantTokens } from "../shared.js";

const STATUS_KEYS = ["complete", "current", "upcoming", "error"] as const;
const STATUS_FIELDS = [
  "indicatorBackgroundColor",
  "indicatorColor",
  "indicatorBorder",
  "labelColor",
  "connectorColor",
] as const;
const SIZE_FIELDS = ["indicatorSize", "typography", "gap"] as const;

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
  return `{
      backgroundColor: ${fields.indicatorBackgroundColor!.reference},
      color: ${fields.indicatorColor!.reference},
      border: ${fields.indicatorBorder!.reference},
    }`;
}

function statusLabelStyleBody(fields: Record<string, TokenImport>): string {
  return `{ color: ${fields.labelColor!.reference} }`;
}

function statusConnectorStyleBody(fields: Record<string, TokenImport>): string {
  return `{ backgroundColor: ${fields.connectorColor!.reference} }`;
}

function sizeIndicatorStyleBody(fields: Record<string, TokenImport>): string {
  return `{ width: ${fields.indicatorSize!.reference}, height: ${fields.indicatorSize!.reference} }`;
}

function sizeLabelStyleBody(fields: Record<string, TokenImport>): string {
  return `{ gap: ${fields.gap!.reference} }`;
}

export function generateStepsSources(bindings: {
  labelTypography: TokenImport;
  descriptionTypography: TokenImport;
  descriptionColor: TokenImport;
  connectorThickness: TokenImport;
  connectorSpacing: TokenImport;
  indicatorBorderRadius: TokenImport;
  /** Build-time config, baked directly into the generated component. */
  completeIcon: string;
  errorIcon: string;
  tokens: Record<string, TokenImport>;
}): ComponentSourceFiles {
  const {
    labelTypography,
    descriptionTypography,
    descriptionColor,
    connectorThickness,
    connectorSpacing,
    indicatorBorderRadius,
    completeIcon,
    errorIcon,
    tokens,
  } = bindings;
  const statuses = groupVariantTokens(tokens, "statuses", STATUS_FIELDS);
  const sizes = groupVariantTokens(tokens, "sizes", SIZE_FIELDS);
  const sizeNames = Object.keys(sizes);

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const stepsRoot = style({
  display: "flex",
  boxSizing: "border-box",
  listStyle: "none",
  margin: 0,
  padding: 0,
  selectors: {
    '&[data-orientation="vertical"]': {
      flexDirection: "column",
    },
  },
});

export const stepsRootSize = styleVariants({
${sizeNames.map((name) => `  ${JSON.stringify(name)}: ${sizeLabelStyleBody(sizes[name]!)},`).join("\n")}
});

export const stepsStep = style({
  display: "flex",
  flex: 1,
  boxSizing: "border-box",
  selectors: {
    '[data-orientation="vertical"] &': {
      flexDirection: "row",
    },
    '[data-orientation="horizontal"] &': {
      flexDirection: "column",
    },
  },
});

export const stepsIndicatorRow = style({
  display: "flex",
  alignItems: "center",
  selectors: {
    '[data-orientation="vertical"] &': {
      flexDirection: "column",
    },
  },
});

export const stepsIndicator = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  flexShrink: 0,
  borderRadius: ${indicatorBorderRadius.reference},
});

export const stepsIndicatorSize = styleVariants({
${sizeNames.map((name) => `  ${JSON.stringify(name)}: ${sizeIndicatorStyleBody(sizes[name]!)},`).join("\n")}
});

export const stepsIndicatorStatus = styleVariants({
${STATUS_KEYS.map((name) => `  ${JSON.stringify(name)}: ${statusIndicatorStyleBody(statuses[name] ?? {})},`).join("\n")}
});

export const stepsConnector = style({
  flex: 1,
  boxSizing: "border-box",
  height: ${connectorThickness.reference},
  marginLeft: ${connectorSpacing.reference},
  marginRight: ${connectorSpacing.reference},
  selectors: {
    '[data-orientation="vertical"] &': {
      width: ${connectorThickness.reference},
      height: "auto",
      marginLeft: 0,
      marginRight: 0,
      marginTop: ${connectorSpacing.reference},
      marginBottom: ${connectorSpacing.reference},
    },
  },
});

export const stepsConnectorStatus = styleVariants({
${STATUS_KEYS.map((name) => `  ${JSON.stringify(name)}: ${statusConnectorStyleBody(statuses[name] ?? {})},`).join("\n")}
});

export const stepsContent = style({
  boxSizing: "border-box",
  paddingLeft: "0.5rem",
});

export const stepsLabel = style({
  margin: 0,
  ${typographyProps(labelTypography.reference)},
});

export const stepsLabelStatus = styleVariants({
${STATUS_KEYS.map((name) => `  ${JSON.stringify(name)}: ${statusLabelStyleBody(statuses[name] ?? {})},`).join("\n")}
});

export const stepsDescription = style({
  margin: 0,
  color: ${descriptionColor.reference},
  ${typographyProps(descriptionTypography.reference)},
});
`,
    component: `import type { ComponentPropsWithoutRef, ReactNode } from "react";
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

const CompleteIcon = icons[${JSON.stringify(completeIcon)}];
const ErrorIcon = icons[${JSON.stringify(errorIcon)}];

export type StepsSize = ${sizeNames.map((n) => JSON.stringify(n)).join(" | ")};
export type StepStatus = "complete" | "current" | "upcoming" | "error";

export interface Step {
  label: ReactNode;
  description?: ReactNode;
  status?: StepStatus;
}

export interface StepsProps extends CommonComponentProps {
  steps: Step[];
  /** Derives each step's status when \`Step.status\` is omitted. */
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
  size = ${JSON.stringify(sizeNames[0] ?? "md")},
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
`,
  };
}
