import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  bannerActions,
  bannerContent,
  bannerDismiss,
  bannerIcon,
  bannerLeadingIcon,
  bannerRoot,
  bannerStatus,
  bannerStatusIconColor,
  bannerStatusTitleColor,
  bannerTitle,
} from "./Banner.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";

export type BannerStatusToken = "info" | "success" | "warning" | "danger";

const STATUS_ICONS: Record<BannerStatusToken, IconType> = {
  "info": "info" as IconType,
  "success": "check" as IconType,
  "warning": "alert" as IconType,
  "danger": "alert" as IconType,
};

export interface BannerProps extends CommonComponentProps {
  status?: BannerStatusToken;
  title?: ReactNode;
  /** `false` opts out of the status' default icon. */
  icon?: IconType | false;
  onDismiss?: () => void;
  actions?: ReactNode;
  children?: ReactNode;
  render?: RenderProp<"div">;
}

export function Banner({
  status = "info",
  title,
  icon,
  onDismiss,
  actions,
  className,
  render,
  children,
  ...props
}: BannerProps) {
  const iconKey = icon === false ? undefined : (icon ?? STATUS_ICONS[status]);
  const Icon = iconKey ? icons[iconKey] : undefined;
  const CloseIcon = icons["close"];

  const classes = [bannerRoot, bannerStatus[status], className].filter(Boolean).join(" ");

  const content = (
    <>
      {Icon && <Icon className={[bannerLeadingIcon, bannerStatusIconColor[status]].join(" ")} aria-hidden="true" />}
      <div className={bannerContent}>
        {title !== undefined && (
          <p className={[bannerTitle, bannerStatusTitleColor[status]].join(" ")}>{title}</p>
        )}
        {children}
      </div>
      {(actions !== undefined || onDismiss) && (
        <div className={bannerActions}>
          {actions}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className={bannerDismiss}
              aria-label="Dismiss"
            >
              <CloseIcon className={bannerIcon} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </>
  );

  const rootProps: Record<string, unknown> = {
    ...props,
    role: "status",
    "data-slot": "banner",
    className: classes,
    children: content,
  };

  return renderElement("div", render, rootProps as ComponentPropsWithoutRef<"div">);
}
