import type { ComponentSourceFiles, TokenImport } from "../types.js";
import { focusRingBlock, groupVariantIcons, groupVariantTokens } from "./shared.js";

const STATUS_FIELDS = [
  "color",
  "backgroundColor",
  "borderColor",
  "iconColor",
  "titleColor",
] as const;

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

function statusRootStyleBody(fields: Record<string, TokenImport>): string {
  return `{
      color: ${fields.color!.reference},
      backgroundColor: ${fields.backgroundColor!.reference},
      borderColor: ${fields.borderColor!.reference},
    }`;
}

function statusIconStyleBody(fields: Record<string, TokenImport>): string {
  return `{ color: ${fields.iconColor!.reference} }`;
}

function statusTitleStyleBody(fields: Record<string, TokenImport>): string {
  return `{ color: ${fields.titleColor!.reference} }`;
}

function generateToastSources(bindings: {
  backgroundColor: TokenImport;
  border: TokenImport;
  borderRadius: TokenImport;
  shadow: TokenImport;
  titleTypography: TokenImport;
  descriptionTypography: TokenImport;
  descriptionColor: TokenImport;
  horizontalSpacing: TokenImport;
  verticalSpacing: TokenImport;
  gap: TokenImport;
  stackGap: TokenImport;
  offset: TokenImport;
  width: TokenImport;
  iconSize: TokenImport;
  transition: TokenImport;
  closeIcon: string;
  tokens: Record<string, TokenImport>;
  icons: Record<string, string>;
  focusRingColor: TokenImport | undefined;
}): ComponentSourceFiles {
  const {
    backgroundColor,
    border,
    borderRadius,
    shadow,
    titleTypography,
    descriptionTypography,
    descriptionColor,
    horizontalSpacing,
    verticalSpacing,
    gap,
    stackGap,
    offset,
    width,
    iconSize,
    transition,
    closeIcon,
    tokens,
    icons,
    focusRingColor,
  } = bindings;
  const statuses = groupVariantTokens(tokens, "statuses", STATUS_FIELDS);
  const statusNames = Object.keys(statuses);
  const statusIcons = groupVariantIcons(icons, "statuses", ["icon"]);

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const toastViewport = style({
  position: "fixed",
  display: "flex",
  flexDirection: "column",
  gap: ${stackGap.reference},
  zIndex: 80,
  outline: "none",
});

export const toastViewportPlacement = styleVariants({
  "top-left": { top: ${offset.reference}, left: ${offset.reference} },
  "top-right": { top: ${offset.reference}, right: ${offset.reference} },
  "bottom-left": { bottom: ${offset.reference}, left: ${offset.reference} },
  "bottom-right": { bottom: ${offset.reference}, right: ${offset.reference} },
});

export const toastRoot = style({
  boxSizing: "border-box",
  display: "flex",
  alignItems: "flex-start",
  width: ${width.reference},
  gap: ${gap.reference},
  border: ${border.reference},
  borderRadius: ${borderRadius.reference},
  backgroundColor: ${backgroundColor.reference},
  boxShadow: ${shadow.reference},
  paddingLeft: ${horizontalSpacing.reference},
  paddingRight: ${horizontalSpacing.reference},
  paddingTop: ${verticalSpacing.reference},
  paddingBottom: ${verticalSpacing.reference},
  transitionProperty: "opacity, transform",
  transitionDuration: ${transition.reference}.transitionDuration,
  transitionTimingFunction: ${transition.reference}.transitionTimingFunction,
  selectors: {
    "&[data-starting-style], &[data-ending-style]": {
      opacity: 0,
    },
  },
});

export const toastRootStatus = styleVariants({
${statusNames.map((name) => `  ${JSON.stringify(name)}: ${statusRootStyleBody(statuses[name]!)},`).join("\n")}
});

export const toastIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: ${iconSize.reference},
  height: ${iconSize.reference},
});

export const toastIconStatus = styleVariants({
${statusNames.map((name) => `  ${JSON.stringify(name)}: ${statusIconStyleBody(statuses[name]!)},`).join("\n")}
});

export const toastContent = style({
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: ${gap.reference},
});

export const toastTitle = style({
  margin: 0,
  ${typographyProps(titleTypography.reference)},
});

export const toastTitleStatus = styleVariants({
${statusNames.map((name) => `  ${JSON.stringify(name)}: ${statusTitleStyleBody(statuses[name]!)},`).join("\n")}
});

export const toastDescription = style({
  margin: 0,
  color: ${descriptionColor.reference},
  ${typographyProps(descriptionTypography.reference)},
});

export const toastActions = style({
  display: "flex",
  alignItems: "center",
  flexShrink: 0,
  gap: ${gap.reference},
});

export const toastActionButton = style({
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: "inherit",
  textDecoration: "underline",
  ${focusRingBlock(focusRingColor)}
});

export const toastClose = style({
  display: "inline-flex",
  flexShrink: 0,
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: "inherit",
  ${focusRingBlock(focusRingColor)}
});
`,
    component: `import { useCallback, useMemo, useState, type ReactNode } from "react";
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

export type ToastStatusToken = ${statusNames.map((n) => JSON.stringify(n)).join(" | ")};

const STATUS_ICONS: Record<ToastStatusToken, IconType> = {
${statusNames.map((name) => `  ${JSON.stringify(name)}: ${JSON.stringify(statusIcons[name]!.icon)} as IconType,`).join("\n")}
};

const CloseIcon = icons[${JSON.stringify(closeIcon)}];

export interface ToastOptions {
  title: ReactNode;
  description?: ReactNode;
  status?: ToastStatusToken;
  /** \`false\` opts out of the status' default icon. */
  icon?: IconType | false;
  /** Auto-dismiss delay in ms; \`0\` keeps the toast until dismissed. */
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
        const status = (item.type ?? ${JSON.stringify(statusNames[0] ?? "info")}) as ToastStatusToken;
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
`,
  };
}

import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import type { IconName } from "../internal/icon-map-icons.js";
import { vanillaExtractComponentOutput } from "./shared.js";

type ToastStatusFields = {
  color: TokenBinding<"color">;
  backgroundColor: TokenBinding<"color">;
  borderColor: TokenBinding<"color">;
  iconColor: TokenBinding<"color">;
  titleColor: TokenBinding<"color">;
  icon: IconName;
};

export type ToastComponentOptions = {
  statuses: Record<string, ToastStatusFields>;
  backgroundColor: TokenBinding<"color">;
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
  shadow: TokenBinding<"shadow">;
  titleTypography: TokenBinding<"typography">;
  descriptionTypography: TokenBinding<"typography">;
  descriptionColor: TokenBinding<"color">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
  stackGap: TokenBinding<"dimension">;
  offset: TokenBinding<"dimension">;
  width: TokenBinding<"dimension">;
  iconSize: TokenBinding<"dimension">;
  transition: TokenBinding<"transition">;
  closeIcon: IconName;
};

export const toastComponent = defineRegistryComponent<ToastComponentOptions>()({
  id: "toast",
  name: "Toast",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    statuses: {
      kind: "variants",
      description: "Toast's own palette, consumer-defined keys, drives the status prop.",
      fields: {
        color: { kind: "token", type: "color" },
        backgroundColor: { kind: "token", type: "color" },
        borderColor: { kind: "token", type: "color" },
        iconColor: { kind: "token", type: "color" },
        titleColor: { kind: "token", type: "color" },
        icon: { kind: "icon" },
      },
    },
    backgroundColor: { kind: "token", type: "color", description: "Background color of a toast." },
    border: { kind: "token", type: "border", description: "Border applied around a toast." },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to a toast.",
    },
    shadow: { kind: "token", type: "shadow", description: "Shadow applied to a toast." },
    titleTypography: {
      kind: "token",
      type: "typography",
      description: "Typography of a toast's title.",
    },
    descriptionTypography: {
      kind: "token",
      type: "typography",
      description: "Typography of a toast's description.",
    },
    descriptionColor: {
      kind: "token",
      type: "color",
      description: "Text color of a toast's description.",
    },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of a toast.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of a toast.",
    },
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between the icon, content and action.",
    },
    stackGap: { kind: "token", type: "dimension", description: "Space between stacked toasts." },
    offset: { kind: "token", type: "dimension", description: "Distance from the viewport edge." },
    width: { kind: "token", type: "dimension", description: "Width of a toast." },
    iconSize: { kind: "token", type: "dimension", description: "Size of the status/close icons." },
    transition: {
      kind: "token",
      type: "transition",
      description: "Transition used to enter/exit.",
    },
    closeIcon: { kind: "icon", description: "Icon used by the close button." },
  },
  output: vanillaExtractComponentOutput(
    "toast",
    "Toast",
    (_scales, _breakpoints, tokens, focusRingColor, icons) =>
      generateToastSources({
        backgroundColor: tokens.backgroundColor!,
        border: tokens.border!,
        borderRadius: tokens.borderRadius!,
        shadow: tokens.shadow!,
        titleTypography: tokens.titleTypography!,
        descriptionTypography: tokens.descriptionTypography!,
        descriptionColor: tokens.descriptionColor!,
        horizontalSpacing: tokens.horizontalSpacing!,
        verticalSpacing: tokens.verticalSpacing!,
        gap: tokens.gap!,
        stackGap: tokens.stackGap!,
        offset: tokens.offset!,
        width: tokens.width!,
        iconSize: tokens.iconSize!,
        transition: tokens.transition!,
        closeIcon: icons.closeIcon!,
        tokens,
        icons,
        focusRingColor,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
