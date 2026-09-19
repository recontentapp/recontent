import type { ComponentSourceFiles, TokenImport } from "../types.js";
import { focusRingBlock, groupVariantTokens } from "./shared.js";

const SIZE_FIELDS = ["minSize", "horizontalSpacing", "verticalSpacing", "typography"] as const;

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

function sizeStyleBody(fields: Record<string, TokenImport>): string {
  return `{
      minWidth: ${fields.minSize!.reference},
      paddingLeft: ${fields.horizontalSpacing!.reference},
      paddingRight: ${fields.horizontalSpacing!.reference},
      paddingTop: ${fields.verticalSpacing!.reference},
      paddingBottom: ${fields.verticalSpacing!.reference},
      ${typographyProps(fields.typography!.reference)},
    }`;
}

function generatePaginationSources(bindings: {
  borderRadius: TokenImport;
  border: TokenImport;
  typography: TokenImport;
  color: TokenImport;
  backgroundColor: TokenImport;
  hoverColor: TokenImport;
  hoverBackgroundColor: TokenImport;
  activeColor: TokenImport;
  activeBackgroundColor: TokenImport;
  disabledColor: TokenImport;
  ellipsisColor: TokenImport;
  gap: TokenImport;
  iconSize: TokenImport;
  /** Build-time config, baked directly into the generated component. */
  previousIcon: string;
  nextIcon: string;
  firstIcon: string;
  lastIcon: string;
  tokens: Record<string, TokenImport>;
  focusRingColor: TokenImport | undefined;
}): ComponentSourceFiles {
  const {
    borderRadius,
    border,
    typography,
    color,
    backgroundColor,
    hoverColor,
    hoverBackgroundColor,
    activeColor,
    activeBackgroundColor,
    disabledColor,
    ellipsisColor,
    gap,
    iconSize,
    previousIcon,
    nextIcon,
    firstIcon,
    lastIcon,
    tokens,
    focusRingColor,
  } = bindings;
  const sizes = groupVariantTokens(tokens, "sizes", SIZE_FIELDS);
  const sizeNames = Object.keys(sizes);

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const paginationRoot = style({
  display: "flex",
  alignItems: "center",
  boxSizing: "border-box",
  gap: ${gap.reference},
});

export const paginationButton = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  border: ${border.reference},
  borderRadius: ${borderRadius.reference},
  color: ${color.reference},
  backgroundColor: ${backgroundColor.reference},
  ${typographyProps(typography.reference)},
  ":hover": {
    color: ${hoverColor.reference},
    backgroundColor: ${hoverBackgroundColor.reference},
  },
  ${focusRingBlock(focusRingColor)}
  selectors: {
    "&[data-active]": {
      color: ${activeColor.reference},
      backgroundColor: ${activeBackgroundColor.reference},
    },
    "&:disabled": {
      color: ${disabledColor.reference},
      cursor: "not-allowed",
    },
  },
});

export const paginationButtonSize = styleVariants({
${sizeNames.map((name) => `  ${JSON.stringify(name)}: ${sizeStyleBody(sizes[name]!)},`).join("\n")}
});

export const paginationIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: ${iconSize.reference},
  height: ${iconSize.reference},
});

export const paginationEllipsis = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  color: ${ellipsisColor.reference},
  ${typographyProps(typography.reference)},
});
`,
    component: `import { Fragment, type ComponentPropsWithoutRef } from "react";
import {
  paginationButton,
  paginationButtonSize,
  paginationEllipsis,
  paginationIcon,
  paginationRoot,
} from "./Pagination.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { icons } from "../../iconMap";

const PreviousIcon = icons[${JSON.stringify(previousIcon)}];
const NextIcon = icons[${JSON.stringify(nextIcon)}];
const FirstIcon = icons[${JSON.stringify(firstIcon)}];
const LastIcon = icons[${JSON.stringify(lastIcon)}];

export type PaginationSize = ${sizeNames.map((n) => JSON.stringify(n)).join(" | ")};

export interface PaginationProps extends CommonComponentProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  boundaryCount?: number;
  size?: PaginationSize;
  showFirstLast?: boolean;
  disabled?: boolean;
  /** Accessible name for the navigation landmark. */
  label?: string;
  render?: RenderProp<"nav">;
}

type PaginationRangeItem = number | "start-ellipsis" | "end-ellipsis";

function range(start: number, end: number): number[] {
  return Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i);
}

function getPaginationRange(
  page: number,
  pageCount: number,
  siblingCount: number,
  boundaryCount: number,
): PaginationRangeItem[] {
  const startPages = range(1, Math.min(boundaryCount, pageCount));
  const endPages = range(Math.max(pageCount - boundaryCount + 1, boundaryCount + 1), pageCount);

  const siblingsStart = Math.max(
    Math.min(page - siblingCount, pageCount - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? endPages[0]! - 2 : pageCount - 1,
  );

  return [
    ...startPages,
    ...(siblingsStart > boundaryCount + 2
      ? (["start-ellipsis"] as const)
      : boundaryCount + 1 < pageCount - boundaryCount
        ? [boundaryCount + 1]
        : []),
    ...range(siblingsStart, siblingsEnd),
    ...(siblingsEnd < pageCount - boundaryCount - 1
      ? (["end-ellipsis"] as const)
      : pageCount - boundaryCount > boundaryCount
        ? [pageCount - boundaryCount]
        : []),
    ...endPages,
  ];
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  siblingCount = 1,
  boundaryCount = 1,
  size = ${JSON.stringify(sizeNames[0] ?? "md")},
  showFirstLast = false,
  disabled = false,
  label = "Pagination",
  className,
  render,
  ...props
}: PaginationProps) {
  const classes = [paginationRoot, className].filter(Boolean).join(" ");
  const items = getPaginationRange(page, pageCount, siblingCount, boundaryCount);

  const content = (
    <>
      {showFirstLast && (
        <button
          type="button"
          className={[paginationButton, paginationButtonSize[size]].join(" ")}
          disabled={disabled || page <= 1}
          aria-label="First page"
          onClick={() => onPageChange(1)}
        >
          <FirstIcon className={paginationIcon} aria-hidden="true" style={{ transform: "rotate(90deg)" }} />
        </button>
      )}
      <button
        type="button"
        className={[paginationButton, paginationButtonSize[size]].join(" ")}
        disabled={disabled || page <= 1}
        aria-label="Previous page"
        onClick={() => onPageChange(page - 1)}
      >
        <PreviousIcon className={paginationIcon} aria-hidden="true" style={{ transform: "rotate(90deg)" }} />
      </button>
      {items.map((item, index) =>
        typeof item === "number" ? (
          <button
            key={item}
            type="button"
            className={[paginationButton, paginationButtonSize[size]].join(" ")}
            disabled={disabled}
            data-active={item === page || undefined}
            aria-current={item === page ? "page" : undefined}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ) : (
          <Fragment key={\`\${item}-\${index}\`}>
            <span className={paginationEllipsis}>&hellip;</span>
          </Fragment>
        ),
      )}
      <button
        type="button"
        className={[paginationButton, paginationButtonSize[size]].join(" ")}
        disabled={disabled || page >= pageCount}
        aria-label="Next page"
        onClick={() => onPageChange(page + 1)}
      >
        <NextIcon className={paginationIcon} aria-hidden="true" style={{ transform: "rotate(-90deg)" }} />
      </button>
      {showFirstLast && (
        <button
          type="button"
          className={[paginationButton, paginationButtonSize[size]].join(" ")}
          disabled={disabled || page >= pageCount}
          aria-label="Last page"
          onClick={() => onPageChange(pageCount)}
        >
          <LastIcon className={paginationIcon} aria-hidden="true" style={{ transform: "rotate(-90deg)" }} />
        </button>
      )}
    </>
  );

  const rootProps: Record<string, unknown> = {
    ...props,
    "aria-label": label,
    "data-slot": "pagination",
    className: classes,
    children: content,
  };

  return renderElement("nav", render, rootProps as ComponentPropsWithoutRef<"nav">);
}
`,
  };
}

import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import type { IconName } from "../internal/icon-map-icons.js";
import { vanillaExtractComponentOutput } from "./shared.js";

type PaginationSizeFields = {
  minSize: TokenBinding<"dimension">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  typography: TokenBinding<"typography">;
};

export type PaginationComponentOptions = {
  borderRadius: TokenBinding<"dimension">;
  border: TokenBinding<"border">;
  typography: TokenBinding<"typography">;
  color: TokenBinding<"color">;
  backgroundColor: TokenBinding<"color">;
  hoverColor: TokenBinding<"color">;
  hoverBackgroundColor: TokenBinding<"color">;
  activeColor: TokenBinding<"color">;
  activeBackgroundColor: TokenBinding<"color">;
  disabledColor: TokenBinding<"color">;
  ellipsisColor: TokenBinding<"color">;
  sizes: Record<string, PaginationSizeFields>;
  gap: TokenBinding<"dimension">;
  iconSize: TokenBinding<"dimension">;
  previousIcon: IconName;
  nextIcon: IconName;
  firstIcon: IconName;
  lastIcon: IconName;
};

export const paginationComponent = defineRegistryComponent<PaginationComponentOptions>()({
  id: "pagination",
  name: "Pagination",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius of a page control.",
    },
    border: { kind: "token", type: "border", description: "Border applied around a page control." },
    typography: { kind: "token", type: "typography", description: "Typography of a page control." },
    color: { kind: "token", type: "color", description: "Text color of a page control." },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of a page control.",
    },
    hoverColor: {
      kind: "token",
      type: "color",
      description: "Text color of a page control on hover.",
    },
    hoverBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of a page control on hover.",
    },
    activeColor: { kind: "token", type: "color", description: "Text color of the active page." },
    activeBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the active page.",
    },
    disabledColor: {
      kind: "token",
      type: "color",
      description: "Text color of a disabled control.",
    },
    ellipsisColor: { kind: "token", type: "color", description: "Color of the ellipsis." },
    sizes: {
      kind: "variants",
      description: "Consumer-defined sizes, drives the size prop.",
      fields: {
        minSize: { kind: "token", type: "dimension" },
        horizontalSpacing: { kind: "token", type: "dimension" },
        verticalSpacing: { kind: "token", type: "dimension" },
        typography: { kind: "token", type: "typography" },
      },
    },
    gap: { kind: "token", type: "dimension", description: "Space between page controls." },
    iconSize: { kind: "token", type: "dimension", description: "Size of the navigation icons." },
    previousIcon: { kind: "icon", description: "Icon used to navigate to the previous page." },
    nextIcon: { kind: "icon", description: "Icon used to navigate to the next page." },
    firstIcon: { kind: "icon", description: "Icon used to navigate to the first page." },
    lastIcon: { kind: "icon", description: "Icon used to navigate to the last page." },
  },
  output: vanillaExtractComponentOutput(
    "pagination",
    "Pagination",
    (_scales, _breakpoints, tokens, focusRingColor, icons) =>
      generatePaginationSources({
        borderRadius: tokens.borderRadius!,
        border: tokens.border!,
        typography: tokens.typography!,
        color: tokens.color!,
        backgroundColor: tokens.backgroundColor!,
        hoverColor: tokens.hoverColor!,
        hoverBackgroundColor: tokens.hoverBackgroundColor!,
        activeColor: tokens.activeColor!,
        activeBackgroundColor: tokens.activeBackgroundColor!,
        disabledColor: tokens.disabledColor!,
        ellipsisColor: tokens.ellipsisColor!,
        gap: tokens.gap!,
        iconSize: tokens.iconSize!,
        previousIcon: icons.previousIcon!,
        nextIcon: icons.nextIcon!,
        firstIcon: icons.firstIcon!,
        lastIcon: icons.lastIcon!,
        tokens,
        focusRingColor,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
