import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Toast as BaseToast } from "@base-ui/react/toast";
import {
  toastActionButton,
  toastActions,
  toastClose,
  toastContent,
  toastDescription,
  toastIcon,
  toastIconStatus,
  toastRoot,
  toastRootStatus,
  toastTitle,
  toastTitleStatus,
  toastViewport,
  toastViewportPlacement,
} from "./Toast.gen.css";
import type { CommonComponentProps } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";

export type ToastStatusToken = "info" | "success" | "warning" | "danger";

const STATUS_ICONS: Record<ToastStatusToken, IconType> = {
  "info": "info" as IconType,
  "success": "check" as IconType,
  "warning": "alert" as IconType,
  "danger": "alert" as IconType,
};

const CloseIcon = icons["close"];

export interface ToastOptions {
  title: ReactNode;
  description?: ReactNode;
  status?: ToastStatusToken;
  /** `false` opts out of the status' default icon. */
  icon?: IconType | false;
  /** Auto-dismiss delay in ms; `0` keeps the toast until dismissed. */
  duration?: number;
  action?: { label: ReactNode; onClick: () => void };
  onDismiss?: () => void;
}

export interface ToastProviderProps extends CommonComponentProps {
  children?: ReactNode;
  placement?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  limit?: number;
}

export interface UseToastReturn {
  /** Returns the toast id, so it can be dismissed or updated later. */
  toast: (options: ToastOptions) => string;
  update: (id: string, options: Partial<ToastOptions>) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

function ToastList() {
  const { toasts } = BaseToast.useToastManager();
  return (
    <>
      {toasts.map((item) => {
        const status = (item.type ?? "info") as ToastStatusToken;
        const iconKey = item.data?.icon === false ? undefined : (item.data?.icon as IconType | undefined) ?? STATUS_ICONS[status];
        const Icon = iconKey ? icons[iconKey] : undefined;
        const action = item.data?.action as { label: ReactNode; onClick: () => void } | undefined;

        return (
          <BaseToast.Root key={item.id} toast={item} className={[toastRoot, toastRootStatus[status]].join(" ")}>
            {Icon && <Icon className={[toastIcon, toastIconStatus[status]].join(" ")} aria-hidden="true" />}
            <div className={toastContent}>
              <BaseToast.Title className={[toastTitle, toastTitleStatus[status]].join(" ")} />
              <BaseToast.Description className={toastDescription} />
            </div>
            <div className={toastActions}>
              {action && (
                <button type="button" className={toastActionButton} onClick={action.onClick}>
                  {action.label}
                </button>
              )}
              <BaseToast.Close className={toastClose} aria-label="Dismiss">
                <CloseIcon className={toastIcon} aria-hidden="true" />
              </BaseToast.Close>
            </div>
          </BaseToast.Root>
        );
      })}
    </>
  );
}

export function ToastProvider({
  children,
  placement = "bottom-right",
  limit,
  ...props
}: ToastProviderProps) {
  return (
    <BaseToast.Provider limit={limit}>
      {children}
      <BaseToast.Portal>
        <BaseToast.Viewport
          {...props}
          className={[toastViewport, toastViewportPlacement[placement]].join(" ")}
          data-slot="toast-viewport"
        >
          <ToastList />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  );
}

export function useToast(): UseToastReturn {
  const manager = BaseToast.useToastManager();

  const toast = useCallback(
    (options: ToastOptions) =>
      manager.add({
        title: options.title,
        description: options.description,
        type: options.status,
        timeout: options.duration,
        onClose: options.onDismiss,
        data: { icon: options.icon, action: options.action },
      }),
    [manager],
  );

  const update = useCallback(
    (id: string, options: Partial<ToastOptions>) =>
      manager.update(id, {
        title: options.title,
        description: options.description,
        type: options.status,
        timeout: options.duration,
        onClose: options.onDismiss,
        data: { icon: options.icon, action: options.action },
      }),
    [manager],
  );

  const dismiss = useCallback((id: string) => manager.close(id), [manager]);

  const dismissAll = useCallback(() => {
    manager.toasts.forEach((item) => manager.close(item.id));
  }, [manager]);

  return useMemo(() => ({ toast, update, dismiss, dismissAll }), [toast, update, dismiss, dismissAll]);
}
