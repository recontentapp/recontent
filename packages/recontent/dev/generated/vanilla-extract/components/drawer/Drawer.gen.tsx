import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";
import {
  drawerBackdrop,
  drawerBody,
  drawerClose,
  drawerCloseIcon,
  drawerFooter,
  drawerHeader,
  drawerPlacement,
  drawerPopup,
  drawerSizeHorizontal,
  drawerSizeVertical,
  drawerTitle,
} from "./Drawer.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";
import { icons } from "../../iconMap";

const CloseIcon = icons["close"];

export type DrawerSize = "sm" | "md" | "lg" | "full";

export interface DrawerProps extends CommonComponentProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: ReactNode;
  trigger?: ReactNode;
  children?: ReactNode;
  placement?: "left" | "right" | "top" | "bottom";
  size?: DrawerSize;
  dismissible?: boolean;
  footer?: ReactNode;
  render?: RenderProp<"div">;
}

export function Drawer({
  open,
  defaultOpen,
  onOpenChange,
  title,
  trigger,
  children,
  placement = "right",
  size = "md",
  dismissible = true,
  footer,
  className,
  render,
  ...props
}: DrawerProps) {
  const sizeClass =
    placement === "left" || placement === "right" ? drawerSizeHorizontal[size] : drawerSizeVertical[size];
  const classes = [drawerPopup, drawerPlacement[placement], sizeClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <BaseDialog.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      disablePointerDismissal={!dismissible}
    >
      {trigger !== undefined && <BaseDialog.Trigger render={trigger as never} />}
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={drawerBackdrop} />
        <BaseDialog.Popup {...props} render={render} className={classes} data-slot="drawer">
          {(title !== undefined || dismissible) && (
            <div className={drawerHeader}>
              {title !== undefined && <BaseDialog.Title className={drawerTitle}>{title}</BaseDialog.Title>}
              {dismissible && (
                <BaseDialog.Close className={drawerClose} aria-label="Close">
                  <CloseIcon className={drawerCloseIcon} aria-hidden="true" />
                </BaseDialog.Close>
              )}
            </div>
          )}
          <div className={drawerBody}>{children}</div>
          {footer !== undefined && <div className={drawerFooter}>{footer}</div>}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
