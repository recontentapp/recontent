import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { focusRingBlock } from "../shared.js";

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

export function generateBreadcrumbSources(bindings: {
  typography: TokenImport;
  color: TokenImport;
  hoverColor: TokenImport;
  currentColor: TokenImport;
  currentTypography: TokenImport;
  separatorColor: TokenImport;
  gap: TokenImport;
  iconSize: TokenImport;
  /** Build-time config, baked directly into the generated component. */
  separatorIcon: string;
  overflowIcon: string;
  focusRingColor: TokenImport | undefined;
}): ComponentSourceFiles {
  const {
    typography,
    color,
    hoverColor,
    currentColor,
    currentTypography,
    separatorColor,
    gap,
    iconSize,
    separatorIcon,
    overflowIcon,
    focusRingColor,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const breadcrumbList = style({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  listStyle: "none",
  margin: 0,
  padding: 0,
  boxSizing: "border-box",
  gap: ${gap.reference},
});

export const breadcrumbItem = style({
  display: "inline-flex",
  alignItems: "center",
  gap: ${gap.reference},
});

export const breadcrumbLink = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.25em",
  color: ${color.reference},
  textDecoration: "none",
  transitionProperty: "color",
  transitionDuration: "150ms",
  transitionTimingFunction: "ease",
  ${typographyProps(typography.reference)},
  ":hover": {
    color: ${hoverColor.reference},
  },
  ${focusRingBlock(focusRingColor)}
});

export const breadcrumbCurrent = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.25em",
  color: ${currentColor.reference},
  ${typographyProps(currentTypography.reference)},
});

export const breadcrumbIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: ${iconSize.reference},
  height: ${iconSize.reference},
});

export const breadcrumbSeparator = style({
  display: "inline-flex",
  flexShrink: 0,
  color: ${separatorColor.reference},
  width: ${iconSize.reference},
  height: ${iconSize.reference},
  transform: "rotate(-90deg)",
});

export const breadcrumbOverflow = style({
  display: "inline-flex",
  alignItems: "center",
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: ${color.reference},
  transitionProperty: "color",
  transitionDuration: "150ms",
  transitionTimingFunction: "ease",
  ":hover": {
    color: ${hoverColor.reference},
  },
  ${focusRingBlock(focusRingColor)}
});
`,
    component: `import { useState, type ComponentPropsWithoutRef, type MouseEventHandler, type ReactNode } from "react";
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

const SeparatorIcon = icons[${JSON.stringify(separatorIcon)}];
const OverflowIcon = icons[${JSON.stringify(overflowIcon)}];

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
`,
  };
}
