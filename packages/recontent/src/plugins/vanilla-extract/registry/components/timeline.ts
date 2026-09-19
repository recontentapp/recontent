import type { ComponentSourceFiles, TokenImport } from "../types.js";
import { groupVariantTokens } from "./shared.js";

const STATUS_FIELDS = ["indicatorColor", "indicatorBackgroundColor", "indicatorBorder"] as const;
const SIZE_FIELDS = ["indicatorSize", "gap", "typography"] as const;

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
      color: ${fields.indicatorColor!.reference},
      backgroundColor: ${fields.indicatorBackgroundColor!.reference},
      border: ${fields.indicatorBorder!.reference},
    }`;
}

function sizeIndicatorStyleBody(fields: Record<string, TokenImport>): string {
  return `{ width: ${fields.indicatorSize!.reference}, height: ${fields.indicatorSize!.reference} }`;
}

function sizeContentStyleBody(fields: Record<string, TokenImport>): string {
  return `{ gap: ${fields.gap!.reference}, ${typographyProps(fields.typography!.reference)} }`;
}

function generateTimelineSources(bindings: {
  connectorColor: TokenImport;
  connectorThickness: TokenImport;
  connectorSpacing: TokenImport;
  labelTypography: TokenImport;
  labelColor: TokenImport;
  descriptionTypography: TokenImport;
  descriptionColor: TokenImport;
  timestampTypography: TokenImport;
  timestampColor: TokenImport;
  itemGap: TokenImport;
  iconSize: TokenImport;
  tokens: Record<string, TokenImport>;
}): ComponentSourceFiles {
  const {
    connectorColor,
    connectorThickness,
    connectorSpacing,
    labelTypography,
    labelColor,
    descriptionTypography,
    descriptionColor,
    timestampTypography,
    timestampColor,
    itemGap,
    tokens,
  } = bindings;
  const statuses = groupVariantTokens(tokens, "statuses", STATUS_FIELDS);
  const sizes = groupVariantTokens(tokens, "sizes", SIZE_FIELDS);
  const statusNames = Object.keys(statuses);
  const sizeNames = Object.keys(sizes);

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const timelineRoot = style({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  listStyle: "none",
  margin: 0,
  padding: 0,
  gap: ${itemGap.reference},
  selectors: {
    '&[data-orientation="horizontal"]': {
      flexDirection: "row",
    },
  },
});

export const timelineItem = style({
  display: "flex",
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

export const timelineIndicatorColumn = style({
  display: "flex",
  alignItems: "center",
  selectors: {
    '[data-orientation="vertical"] &': {
      flexDirection: "column",
    },
  },
});

export const timelineIndicator = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  flexShrink: 0,
  borderRadius: "50%",
});

export const timelineIndicatorSize = styleVariants({
${sizeNames.map((name) => `  ${JSON.stringify(name)}: ${sizeIndicatorStyleBody(sizes[name]!)},`).join("\n")}
});

export const timelineIndicatorStatus = styleVariants({
${statusNames.map((name) => `  ${JSON.stringify(name)}: ${statusIndicatorStyleBody(statuses[name]!)},`).join("\n")}
});

export const timelineIcon = style({
  width: "60%",
  height: "60%",
});

export const timelineConnector = style({
  flex: 1,
  boxSizing: "border-box",
  backgroundColor: ${connectorColor.reference},
  selectors: {
    '[data-orientation="vertical"] &': {
      width: ${connectorThickness.reference},
      marginTop: ${connectorSpacing.reference},
      marginBottom: ${connectorSpacing.reference},
    },
    '[data-orientation="horizontal"] &': {
      height: ${connectorThickness.reference},
      marginLeft: ${connectorSpacing.reference},
      marginRight: ${connectorSpacing.reference},
    },
  },
});

export const timelineContent = style({
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  paddingLeft: "0.5rem",
  paddingBottom: "0.5rem",
});

export const timelineContentSize = styleVariants({
${sizeNames.map((name) => `  ${JSON.stringify(name)}: ${sizeContentStyleBody(sizes[name]!)},`).join("\n")}
});

export const timelineLabel = style({
  margin: 0,
  color: ${labelColor.reference},
  ${typographyProps(labelTypography.reference)},
});

export const timelineTimestamp = style({
  margin: 0,
  color: ${timestampColor.reference},
  ${typographyProps(timestampTypography.reference)},
});

export const timelineDescription = style({
  margin: 0,
  color: ${descriptionColor.reference},
  ${typographyProps(descriptionTypography.reference)},
});
`,
    component: `import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  timelineConnector,
  timelineContent,
  timelineContentSize,
  timelineDescription,
  timelineIcon,
  timelineIndicator,
  timelineIndicatorColumn,
  timelineIndicatorSize,
  timelineIndicatorStatus,
  timelineItem,
  timelineLabel,
  timelineRoot,
  timelineTimestamp,
} from "./Timeline.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";

export type TimelineStatusToken = ${statusNames.map((n) => JSON.stringify(n)).join(" | ")};
export type TimelineSize = ${sizeNames.map((n) => JSON.stringify(n)).join(" | ")};

export interface TimelineItem {
  label: ReactNode;
  description?: ReactNode;
  timestamp?: Date | string;
  icon?: IconType;
  status?: TimelineStatusToken;
}

export interface TimelineProps extends CommonComponentProps {
  items: TimelineItem[];
  orientation?: "vertical" | "horizontal";
  size?: TimelineSize;
  formatTimestamp?: (timestamp: Date | string) => ReactNode;
  render?: RenderProp<"ol">;
}

function defaultFormatTimestamp(timestamp: Date | string): ReactNode {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return Number.isNaN(date.getTime()) ? String(timestamp) : date.toLocaleDateString();
}

export function Timeline({
  items,
  orientation = "vertical",
  size = ${JSON.stringify(sizeNames[0] ?? "md")},
  formatTimestamp = defaultFormatTimestamp,
  className,
  render,
  ...props
}: TimelineProps) {
  const classes = [timelineRoot, className].filter(Boolean).join(" ");

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "timeline",
    "data-orientation": orientation,
    className: classes,
    children: items.map((item, index) => {
      const status = item.status ?? ${JSON.stringify(statusNames[0] ?? "neutral")};
      const Icon = item.icon ? icons[item.icon] : undefined;
      const isLast = index === items.length - 1;

      return (
        <li key={index} className={timelineItem} data-orientation={orientation}>
          <span className={timelineIndicatorColumn} data-orientation={orientation}>
            <span
              className={[timelineIndicator, timelineIndicatorSize[size], timelineIndicatorStatus[status]].join(" ")}
            >
              {Icon && <Icon className={timelineIcon} aria-hidden="true" />}
            </span>
            {!isLast && <span className={timelineConnector} data-orientation={orientation} aria-hidden="true" />}
          </span>
          <span className={[timelineContent, timelineContentSize[size]].join(" ")}>
            <p className={timelineLabel}>{item.label}</p>
            {item.timestamp !== undefined && (
              <p className={timelineTimestamp}>{formatTimestamp(item.timestamp)}</p>
            )}
            {item.description !== undefined && (
              <p className={timelineDescription}>{item.description}</p>
            )}
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

import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { vanillaExtractComponentOutput } from "./shared.js";

type TimelineStatusFields = {
  indicatorColor: TokenBinding<"color">;
  indicatorBackgroundColor: TokenBinding<"color">;
  indicatorBorder: TokenBinding<"border">;
};

type TimelineSizeFields = {
  indicatorSize: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
  typography: TokenBinding<"typography">;
};

export type TimelineComponentOptions = {
  statuses: Record<string, TimelineStatusFields>;
  sizes: Record<string, TimelineSizeFields>;
  connectorColor: TokenBinding<"color">;
  connectorThickness: TokenBinding<"dimension">;
  connectorSpacing: TokenBinding<"dimension">;
  labelTypography: TokenBinding<"typography">;
  labelColor: TokenBinding<"color">;
  descriptionTypography: TokenBinding<"typography">;
  descriptionColor: TokenBinding<"color">;
  timestampTypography: TokenBinding<"typography">;
  timestampColor: TokenBinding<"color">;
  itemGap: TokenBinding<"dimension">;
  iconSize: TokenBinding<"dimension">;
};

export const timelineComponent = defineRegistryComponent<TimelineComponentOptions>()({
  id: "timeline",
  name: "Timeline",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    statuses: {
      kind: "variants",
      description: "Timeline's own palette, consumer-defined keys, drives each item's status prop.",
      fields: {
        indicatorColor: { kind: "token", type: "color" },
        indicatorBackgroundColor: { kind: "token", type: "color" },
        indicatorBorder: { kind: "token", type: "border" },
      },
    },
    sizes: {
      kind: "variants",
      description: "Consumer-defined sizes, drives the size prop.",
      fields: {
        indicatorSize: { kind: "token", type: "dimension" },
        gap: { kind: "token", type: "dimension" },
        typography: { kind: "token", type: "typography" },
      },
    },
    connectorColor: { kind: "token", type: "color", description: "Color of the connector line." },
    connectorThickness: {
      kind: "token",
      type: "dimension",
      description: "Thickness of the connector line.",
    },
    connectorSpacing: {
      kind: "token",
      type: "dimension",
      description: "Margin around the connector line.",
    },
    labelTypography: {
      kind: "token",
      type: "typography",
      description: "Typography of an item's label.",
    },
    labelColor: { kind: "token", type: "color", description: "Text color of an item's label." },
    descriptionTypography: {
      kind: "token",
      type: "typography",
      description: "Typography of an item's description.",
    },
    descriptionColor: {
      kind: "token",
      type: "color",
      description: "Text color of an item's description.",
    },
    timestampTypography: {
      kind: "token",
      type: "typography",
      description: "Typography of an item's timestamp.",
    },
    timestampColor: {
      kind: "token",
      type: "color",
      description: "Text color of an item's timestamp.",
    },
    itemGap: { kind: "token", type: "dimension", description: "Space between items." },
    iconSize: { kind: "token", type: "dimension", description: "Size of an item's icon." },
  },
  output: vanillaExtractComponentOutput("timeline", "Timeline", (_scales, _breakpoints, tokens) =>
    generateTimelineSources({
      connectorColor: tokens.connectorColor!,
      connectorThickness: tokens.connectorThickness!,
      connectorSpacing: tokens.connectorSpacing!,
      labelTypography: tokens.labelTypography!,
      labelColor: tokens.labelColor!,
      descriptionTypography: tokens.descriptionTypography!,
      descriptionColor: tokens.descriptionColor!,
      timestampTypography: tokens.timestampTypography!,
      timestampColor: tokens.timestampColor!,
      itemGap: tokens.itemGap!,
      iconSize: tokens.iconSize!,
      tokens,
    }),
  ),
});
