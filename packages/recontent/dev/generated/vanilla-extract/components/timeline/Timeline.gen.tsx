import type { ComponentPropsWithoutRef, ReactNode } from "react";
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

export type TimelineStatusToken = "neutral" | "success" | "error";
export type TimelineSize = "sm" | "md";

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
  size = "sm",
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
      const status = item.status ?? "neutral";
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
