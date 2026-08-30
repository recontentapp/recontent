import { Fragment, type ComponentPropsWithoutRef } from "react";
import {
  paginationButton,
  paginationButtonSize,
  paginationEllipsis,
  paginationIcon,
  paginationRoot,
} from "./Pagination.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { icons } from "../../iconMap";

const PreviousIcon = icons["chevronDown"];
const NextIcon = icons["chevronDown"];
const FirstIcon = icons["chevronDown"];
const LastIcon = icons["chevronDown"];

export type PaginationSize = "sm" | "md";

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
  size = "sm",
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
          <Fragment key={`${item}-${index}`}>
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
