import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { focusRingBlock, groupVariantTokens } from "../shared.js";

const SIZE_KEYS = ["sm", "md", "lg", "fullscreen"] as const;

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

export function generateDialogSources(bindings: {
  backdropColor: TokenImport;
  backgroundColor: TokenImport;
  border: TokenImport;
  borderRadius: TokenImport;
  shadow: TokenImport;
  horizontalSpacing: TokenImport;
  verticalSpacing: TokenImport;
  gap: TokenImport;
  titleTypography: TokenImport;
  titleColor: TokenImport;
  descriptionTypography: TokenImport;
  descriptionColor: TokenImport;
  footerBorder: TokenImport;
  transition: TokenImport;
  /** Build-time config, baked directly into the generated component. */
  closeIcon: string;
  tokens: Record<string, TokenImport>;
  focusRingColor: TokenImport | undefined;
}): ComponentSourceFiles {
  const {
    backdropColor,
    backgroundColor,
    border,
    borderRadius,
    shadow,
    horizontalSpacing,
    verticalSpacing,
    gap,
    titleTypography,
    titleColor,
    descriptionTypography,
    descriptionColor,
    footerBorder,
    transition,
    closeIcon,
    tokens,
    focusRingColor,
  } = bindings;
  const sizes = groupVariantTokens(tokens, "sizes", ["maxWidth"]);

  return {
    styles: `import { keyframes, style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

const fadeIn = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
const zoomIn = keyframes({
  from: { opacity: 0, transform: "scale(0.96)" },
  to: { opacity: 1, transform: "scale(1)" },
});

export const dialogBackdrop = style({
  position: "fixed",
  inset: 0,
  backgroundColor: ${backdropColor.reference},
  zIndex: 60,
  selectors: {
    "&[data-starting-style], &[data-ending-style]": {
      opacity: 0,
    },
  },
  animationName: fadeIn,
  animationDuration: ${transition.reference}.transitionDuration,
  animationTimingFunction: ${transition.reference}.transitionTimingFunction,
});

export const dialogPopup = style({
  position: "fixed",
  top: "50%",
  left: "50%",
  translate: "-50% -50%",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  width: "calc(100% - 2rem)",
  maxHeight: "calc(100vh - 2rem)",
  overflowY: "auto",
  zIndex: 60,
  gap: ${gap.reference},
  backgroundColor: ${backgroundColor.reference},
  border: ${border.reference},
  borderRadius: ${borderRadius.reference},
  boxShadow: ${shadow.reference},
  paddingLeft: ${horizontalSpacing.reference},
  paddingRight: ${horizontalSpacing.reference},
  paddingTop: ${verticalSpacing.reference},
  paddingBottom: ${verticalSpacing.reference},
  selectors: {
    "&[data-starting-style], &[data-ending-style]": {
      opacity: 0,
      transform: "scale(0.96)",
    },
  },
  animationName: zoomIn,
  animationDuration: ${transition.reference}.transitionDuration,
  animationTimingFunction: ${transition.reference}.transitionTimingFunction,
});

export const dialogPopupSize = styleVariants({
${SIZE_KEYS.map((name) => `  ${JSON.stringify(name)}: { maxWidth: ${sizes[name]?.maxWidth?.reference ?? "none"} },`).join("\n")}
});

export const dialogHeader = style({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: ${gap.reference},
});

export const dialogHeaderText = style({
  display: "flex",
  flexDirection: "column",
  gap: ${gap.reference},
  minWidth: 0,
});

export const dialogTitle = style({
  margin: 0,
  color: ${titleColor.reference},
  ${typographyProps(titleTypography.reference)},
});

export const dialogDescription = style({
  margin: 0,
  color: ${descriptionColor.reference},
  ${typographyProps(descriptionTypography.reference)},
});

export const dialogClose = style({
  display: "inline-flex",
  flexShrink: 0,
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: ${titleColor.reference},
  ${focusRingBlock(focusRingColor)}
});

export const dialogCloseIcon = style({
  display: "inline-flex",
  width: "1.25em",
  height: "1.25em",
});

export const dialogBody = style({
  flex: 1,
  minHeight: 0,
});

export const dialogFooter = style({
  display: "flex",
  justifyContent: "flex-end",
  gap: ${gap.reference},
  borderTop: ${footerBorder.reference},
  paddingTop: ${verticalSpacing.reference},
});
`,
    component: `import { Dialog as BaseDialog } from "@base-ui/react/dialog";
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

const CloseIcon = icons[${JSON.stringify(closeIcon)}];

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
`,
  };
}
