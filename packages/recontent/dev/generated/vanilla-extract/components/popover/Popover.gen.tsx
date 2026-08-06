import type { ReactElement, ReactNode } from "react";
import { Popover as BasePopover } from "@base-ui/react/popover";
import {
  popoverArrow,
  popoverArrowShape,
  popoverBackdrop,
  popoverPopup,
  popoverPositioner,
} from "./Popover.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";

export interface PopoverProps extends CommonComponentProps {
  trigger: ReactElement;
  content: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  modal?: boolean;
  render?: RenderProp<"div">;
}

export function Popover({
  trigger,
  content,
  open,
  defaultOpen,
  onOpenChange,
  side = "bottom",
  align = "center",
  modal = false,
  className,
  render,
  ...props
}: PopoverProps) {
  return (
    <BasePopover.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} modal={modal}>
      <BasePopover.Trigger render={trigger} />
      <BasePopover.Portal>
        {modal && <BasePopover.Backdrop className={popoverBackdrop} />}
        <BasePopover.Positioner className={popoverPositioner} side={side} align={align}>
          <BasePopover.Popup
            {...props}
            render={render}
            className={[popoverPopup, className].filter(Boolean).join(" ")}
            data-slot="popover"
          >
            {true && (
              <BasePopover.Arrow className={popoverArrow}>
                <div className={popoverArrowShape} />
              </BasePopover.Arrow>
            )}
            {content}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}
