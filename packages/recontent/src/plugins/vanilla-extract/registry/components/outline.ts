import type { ComponentSourceFiles, TokenImport } from "../types.js";
import { focusRingBlock } from "./shared.js";

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

export function generateOutlineSources(bindings: {
  typography: TokenImport;
  color: TokenImport;
  hoverColor: TokenImport;
  activeColor: TokenImport;
  activeTypography: TokenImport;
  border: TokenImport;
  activeIndicatorColor: TokenImport;
  indentSpacing: TokenImport;
  itemHorizontalSpacing: TokenImport;
  itemVerticalSpacing: TokenImport;
  focusRingColor: TokenImport | undefined;
}): ComponentSourceFiles {
  const {
    typography,
    color,
    hoverColor,
    activeColor,
    activeTypography,
    border,
    activeIndicatorColor,
    indentSpacing,
    itemHorizontalSpacing,
    itemVerticalSpacing,
    focusRingColor,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const outlineRoot = style({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  borderLeft: ${border.reference},
});

export const outlineList = style({
  display: "flex",
  flexDirection: "column",
  margin: 0,
  padding: 0,
  listStyle: "none",
});

export const outlineItem = style({
  position: "relative",
});

export const outlineLink = style({
  display: "block",
  boxSizing: "border-box",
  textDecoration: "none",
  color: ${color.reference},
  paddingLeft: ${itemHorizontalSpacing.reference},
  paddingRight: ${itemHorizontalSpacing.reference},
  paddingTop: ${itemVerticalSpacing.reference},
  paddingBottom: ${itemVerticalSpacing.reference},
  ${typographyProps(typography.reference)},
  ":hover": {
    color: ${hoverColor.reference},
  },
  ${focusRingBlock(focusRingColor)}
  selectors: {
    "&[data-active]": {
      color: ${activeColor.reference},
      ${typographyProps(activeTypography.reference)},
    },
    "&[data-active]::before": {
      content: '""',
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: "2px",
      backgroundColor: ${activeIndicatorColor.reference},
    },
  },
});

export const outlineIndent = style({
  paddingLeft: ${indentSpacing.reference},
});
`,
    component: `import { useEffect, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { outlineIndent, outlineItem, outlineLink, outlineList, outlineRoot } from "./Outline.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";

export interface OutlineItem {
  id: string;
  label: ReactNode;
  depth?: number;
  children?: OutlineItem[];
}

export interface OutlineProps extends CommonComponentProps {
  items: OutlineItem[];
  activeId?: string;
  onItemClick?: (id: string) => void;
  /** Tracks the section in view with an IntersectionObserver. */
  observeScroll?: boolean;
  render?: RenderProp<"nav">;
}

function flattenIds(items: OutlineItem[]): string[] {
  return items.flatMap((item) => [item.id, ...(item.children ? flattenIds(item.children) : [])]);
}

function OutlineList({
  items,
  depth,
  activeId,
  onItemClick,
}: {
  items: OutlineItem[];
  depth: number;
  activeId: string | undefined;
  onItemClick: ((id: string) => void) | undefined;
}) {
  return (
    <ul className={[outlineList, depth > 0 && outlineIndent].filter(Boolean).join(" ")}>
      {items.map((item) => (
        <li key={item.id} className={outlineItem}>
          <a
            href={\`#\${item.id}\`}
            className={outlineLink}
            data-active={item.id === activeId || undefined}
            onClick={(event) => {
              onItemClick?.(item.id);
              if (!onItemClick) return;
              event.preventDefault();
            }}
          >
            {item.label}
          </a>
          {item.children && item.children.length > 0 && (
            <OutlineList items={item.children} depth={depth + 1} activeId={activeId} onItemClick={onItemClick} />
          )}
        </li>
      ))}
    </ul>
  );
}

export function Outline({
  items,
  activeId,
  onItemClick,
  observeScroll = false,
  className,
  render,
  ...props
}: OutlineProps) {
  const [observedActiveId, setObservedActiveId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!observeScroll) return;
    const ids = flattenIds(items);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setObservedActiveId(visible.target.id);
      },
      { rootMargin: "0px 0px -70% 0px" },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [observeScroll, items]);

  const resolvedActiveId = activeId ?? observedActiveId;
  const classes = [outlineRoot, className].filter(Boolean).join(" ");

  const rootProps: Record<string, unknown> = {
    ...props,
    "aria-label": "Table of contents",
    "data-slot": "outline",
    className: classes,
    children: <OutlineList items={items} depth={0} activeId={resolvedActiveId} onItemClick={onItemClick} />,
  };

  return renderElement("nav", render, rootProps as ComponentPropsWithoutRef<"nav">);
}
`,
  };
}

import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { vanillaExtractComponentOutput } from "./shared.js";

export type OutlineComponentOptions = {
  typography: TokenBinding<"typography">;
  color: TokenBinding<"color">;
  hoverColor: TokenBinding<"color">;
  activeColor: TokenBinding<"color">;
  activeTypography: TokenBinding<"typography">;
  border: TokenBinding<"border">;
  activeIndicatorColor: TokenBinding<"color">;
  indentSpacing: TokenBinding<"dimension">;
  itemHorizontalSpacing: TokenBinding<"dimension">;
  itemVerticalSpacing: TokenBinding<"dimension">;
};

export const outlineComponent = defineRegistryComponent<OutlineComponentOptions>()({
  id: "outline",
  name: "Outline",
  internalDependencies: ["render-element"],
  schema: {
    typography: { kind: "token", type: "typography", description: "Typography applied to items." },
    color: { kind: "token", type: "color", description: "Text color of an item." },
    hoverColor: { kind: "token", type: "color", description: "Text color of an item on hover." },
    activeColor: { kind: "token", type: "color", description: "Text color of the active item." },
    activeTypography: {
      kind: "token",
      type: "typography",
      description: "Typography of the active item.",
    },
    border: { kind: "token", type: "border", description: "Border used for the vertical rail." },
    activeIndicatorColor: {
      kind: "token",
      type: "color",
      description: "Color of the indicator aligned with the active item.",
    },
    indentSpacing: {
      kind: "token",
      type: "dimension",
      description: "Indent applied per depth level.",
    },
    itemHorizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of an item.",
    },
    itemVerticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of an item.",
    },
  },
  output: vanillaExtractComponentOutput(
    "outline",
    "Outline",
    (_scales, _breakpoints, tokens, focusRingColor) =>
      generateOutlineSources({
        typography: tokens.typography!,
        color: tokens.color!,
        hoverColor: tokens.hoverColor!,
        activeColor: tokens.activeColor!,
        activeTypography: tokens.activeTypography!,
        border: tokens.border!,
        activeIndicatorColor: tokens.activeIndicatorColor!,
        indentSpacing: tokens.indentSpacing!,
        itemHorizontalSpacing: tokens.itemHorizontalSpacing!,
        itemVerticalSpacing: tokens.itemVerticalSpacing!,
        focusRingColor,
      }),
  ),
});
