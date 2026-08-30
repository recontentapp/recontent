import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import {
  metadataListGap,
  metadataListIcon,
  metadataListItem,
  metadataListItemHorizontal,
  metadataListItemVertical,
  metadataListLabel,
  metadataListLabelRow,
  metadataListRoot,
  metadataListValue,
} from "./MetadataList.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";
import type { RefSpacing as MetadataListGapToken } from "../../tokens.css";

export interface MetadataListItem {
  label: ReactNode;
  value: ReactNode;
  icon?: IconType;
}

export interface MetadataListProps extends CommonComponentProps {
  items: MetadataListItem[];
  orientation?: "horizontal" | "vertical";
  columns?: number;
  gap?: MetadataListGapToken;
  render?: RenderProp<"dl">;
}

export function MetadataList({
  items,
  orientation = "horizontal",
  columns = 1,
  gap,
  className,
  render,
  ...props
}: MetadataListProps) {
  const classes = [metadataListRoot, gap !== undefined && metadataListGap[gap], className]
    .filter(Boolean)
    .join(" ");
  const style = { "--metadata-list-columns": columns } as CSSProperties;

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "metadata-list",
    className: classes,
    style,
    children: items.map((item, index) => {
      const Icon = item.icon ? icons[item.icon] : undefined;
      const itemLayout = orientation === "horizontal" ? metadataListItemHorizontal : metadataListItemVertical;
      return (
        <div key={index} className={[metadataListItem, itemLayout].join(" ")}>
          <span className={metadataListLabelRow}>
            {Icon && <Icon className={metadataListIcon} aria-hidden="true" />}
            <dt className={metadataListLabel}>{item.label}</dt>
          </span>
          <dd className={metadataListValue}>{item.value}</dd>
        </div>
      );
    }),
  };

  return renderElement("dl", render, rootProps as ComponentPropsWithoutRef<"dl">);
}
