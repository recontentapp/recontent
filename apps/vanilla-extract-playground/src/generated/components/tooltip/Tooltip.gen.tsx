import type { ReactElement, ReactNode } from "react";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { tooltipArrow, tooltipArrowShape, tooltipPopup, tooltipPositioner } from "./Tooltip.gen.css";
import type { CommonComponentProps } from "../../renderElement.gen";

export interface TooltipProps extends CommonComponentProps {
  content: ReactNode;
  children: ReactElement;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  /** Hover delay in ms before showing. */
  delay?: number;
  closeDelay?: number;
  disabled?: boolean;
}

/**
 * Short hint shown on hover and focus.
 *
 * @usage Use to name or explain a control, like an {@link IconButton}. It cannot contain
 * interactive content, use {@link Popover} for that.
 *
 * @example
 * <Tooltip content="Search the docs">
 *   <IconButton icon="search" label="Search" />
 * </Tooltip>
 *
 * @category Overlays
 */
export function Tooltip({
  content,
  children,
  open,
  defaultOpen,
  onOpenChange,
  side = "top",
  align = "center",
  delay,
  closeDelay,
  disabled = false,
  className,
  ...props
}: TooltipProps) {
  return (
    <BaseTooltip.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} disabled={disabled}>
      <BaseTooltip.Trigger render={children} delay={delay} closeDelay={closeDelay} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner className={tooltipPositioner} side={side} align={align}>
          <BaseTooltip.Popup
            {...props}
            className={[tooltipPopup, className].filter(Boolean).join(" ")}
            data-slot="tooltip"
          >
            {true && (
              <BaseTooltip.Arrow className={tooltipArrow}>
                <div className={tooltipArrowShape} />
              </BaseTooltip.Arrow>
            )}
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
