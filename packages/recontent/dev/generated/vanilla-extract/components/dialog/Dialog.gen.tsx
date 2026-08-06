import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";
import {
  dialogBackdrop,
  dialogBody,
  dialogClose,
  dialogCloseIcon,
  dialogDescription,
  dialogFooter,
  dialogHeader,
  dialogHeaderText,
  dialogPopup,
  dialogPopupSize,
  dialogTitle,
} from "./Dialog.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";
import { icons } from "../../iconMap";

const CloseIcon = icons["close"];

export type DialogSize = "sm" | "md" | "lg" | "fullscreen";

export interface DialogProps extends CommonComponentProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  trigger?: ReactNode;
  children?: ReactNode;
  size?: DialogSize;
  /** Allows closing via backdrop click, Escape and the close button. */
  dismissible?: boolean;
  footer?: ReactNode;
  render?: RenderProp<"div">;
}

export function Dialog({
  open,
  defaultOpen,
  onOpenChange,
  title,
  description,
  trigger,
  children,
  size = "md",
  dismissible = true,
  footer,
  className,
  render,
  ...props
}: DialogProps) {
  const classes = [dialogPopup, dialogPopupSize[size], className].filter(Boolean).join(" ");

  return (
    <BaseDialog.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      disablePointerDismissal={!dismissible}
    >
      {trigger !== undefined && <BaseDialog.Trigger render={trigger as never} />}
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={dialogBackdrop} />
        <BaseDialog.Popup {...props} render={render} className={classes} data-slot="dialog">
          <div className={dialogHeader}>
            <div className={dialogHeaderText}>
              <BaseDialog.Title className={dialogTitle}>{title}</BaseDialog.Title>
              {description !== undefined && (
                <BaseDialog.Description className={dialogDescription}>{description}</BaseDialog.Description>
              )}
            </div>
            {dismissible && (
              <BaseDialog.Close className={dialogClose} aria-label="Close">
                <CloseIcon className={dialogCloseIcon} aria-hidden="true" />
              </BaseDialog.Close>
            )}
          </div>
          <div className={dialogBody}>{children}</div>
          {footer !== undefined && <div className={dialogFooter}>{footer}</div>}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
