import { useState, type ComponentPropsWithoutRef, type MouseEventHandler, type ReactNode } from "react";
import {
  breadcrumbCurrent,
  breadcrumbIcon,
  breadcrumbItem,
  breadcrumbLink,
  breadcrumbList,
  breadcrumbOverflow,
  breadcrumbSeparator,
} from "./Breadcrumb.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";

const SeparatorIcon = icons["chevronDown"];
const OverflowIcon = icons["info"];

export interface BreadcrumbItem {
  label: ReactNode;
  href?: string;
  icon?: IconType;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export interface BreadcrumbProps extends CommonComponentProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  maxVisibleItems?: number;
  render?: RenderProp<"nav">;
}

export function Breadcrumb({ items, separator, maxVisibleItems, className, render, ...props }: BreadcrumbProps) {
  const [expanded, setExpanded] = useState(false);
  const collapsible =
    !expanded && maxVisibleItems !== undefined && items.length > maxVisibleItems && maxVisibleItems >= 2;

  const visibleItems = collapsible
    ? [items[0]!, ...items.slice(items.length - (maxVisibleItems! - 1))]
    : items;

  const rootProps: Record<string, unknown> = {
    ...props,
    "aria-label": "Breadcrumb",
    "data-slot": "breadcrumb",
    className,
    children: (
      <ol className={breadcrumbList}>
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;
          const Icon = item.icon ? icons[item.icon] : undefined;
          const showOverflowAfter = collapsible && index === 0;

          return (
            <li key={index} className={breadcrumbItem}>
              {isLast ? (
                <span className={breadcrumbCurrent} aria-current="page">
                  {Icon && <Icon className={breadcrumbIcon} aria-hidden="true" />}
                  {item.label}
                </span>
              ) : (
                <a href={item.href} onClick={item.onClick} className={breadcrumbLink}>
                  {Icon && <Icon className={breadcrumbIcon} aria-hidden="true" />}
                  {item.label}
                </a>
              )}
              {!isLast &&
                (separator ?? <SeparatorIcon className={breadcrumbSeparator} aria-hidden="true" />)}
              {showOverflowAfter && (
                <>
                  <button
                    type="button"
                    className={breadcrumbOverflow}
                    aria-label="Show hidden items"
                    onClick={() => setExpanded(true)}
                  >
                    <OverflowIcon className={breadcrumbIcon} aria-hidden="true" />
                  </button>
                  {separator ?? <SeparatorIcon className={breadcrumbSeparator} aria-hidden="true" />}
                </>
              )}
            </li>
          );
        })}
      </ol>
    ),
  };

  return renderElement("nav", render, rootProps as ComponentPropsWithoutRef<"nav">);
}
