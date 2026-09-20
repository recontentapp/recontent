import type { ComponentSourceFiles, TokenImport } from "../types.js";
import { focusRingBlock, groupVariantTokens, typographyProps } from "./shared.js";
import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import type { IconName } from "../internal/icon-map-icons.js";
import { vanillaExtractComponentOutput } from "./shared.js";

const SIZE_KEYS = ["sm", "md", "lg", "fullscreen"] as const;
function generateDialogSources(bindings: {
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
  ${typographyProps(titleTypography.reference, "      ")},
});

export const dialogDescription = style({
  margin: 0,
  color: ${descriptionColor.reference},
  ${typographyProps(descriptionTypography.reference, "      ")},
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

export type DialogComponentOptions = {
  backdropColor: TokenBinding<"color">;
  backgroundColor: TokenBinding<"color">;
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
  shadow: TokenBinding<"shadow">;
  /** Fixed keys, matching the `size` prop's literal union. */
  sizes: Record<"sm" | "md" | "lg" | "fullscreen", { maxWidth: TokenBinding<"dimension"> }>;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
  titleTypography: TokenBinding<"typography">;
  titleColor: TokenBinding<"color">;
  descriptionTypography: TokenBinding<"typography">;
  descriptionColor: TokenBinding<"color">;
  footerBorder: TokenBinding<"border">;
  transition: TokenBinding<"transition">;
  closeIcon: IconName;
};

export const dialogComponent = defineRegistryComponent<DialogComponentOptions>()({
  id: "dialog",
  name: "Dialog",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    backdropColor: {
      kind: "token",
      type: "color",
      description: "Background color of the backdrop.",
    },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the dialog.",
    },
    border: { kind: "token", type: "border", description: "Border applied around the dialog." },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the dialog.",
    },
    shadow: { kind: "token", type: "shadow", description: "Shadow applied to the dialog." },
    sizes: {
      kind: "variants",
      description: "Dialog's fixed sizes (sm | md | lg | fullscreen), drives the size prop.",
      fields: {
        maxWidth: { kind: "token", type: "dimension" },
      },
    },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the dialog.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the dialog.",
    },
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between the header, body and footer.",
    },
    titleTypography: { kind: "token", type: "typography", description: "Typography of the title." },
    titleColor: { kind: "token", type: "color", description: "Text color of the title." },
    descriptionTypography: {
      kind: "token",
      type: "typography",
      description: "Typography of the description.",
    },
    descriptionColor: {
      kind: "token",
      type: "color",
      description: "Text color of the description.",
    },
    footerBorder: { kind: "token", type: "border", description: "Border above the footer." },
    transition: {
      kind: "token",
      type: "transition",
      description: "Transition used to open/close the dialog.",
    },
    closeIcon: { kind: "icon", description: "Icon used by the close button." },
  },
  output: vanillaExtractComponentOutput(
    "dialog",
    "Dialog",
    (_scales, _breakpoints, tokens, focusRingColor, icons) =>
      generateDialogSources({
        backdropColor: tokens.backdropColor!,
        backgroundColor: tokens.backgroundColor!,
        border: tokens.border!,
        borderRadius: tokens.borderRadius!,
        shadow: tokens.shadow!,
        horizontalSpacing: tokens.horizontalSpacing!,
        verticalSpacing: tokens.verticalSpacing!,
        gap: tokens.gap!,
        titleTypography: tokens.titleTypography!,
        titleColor: tokens.titleColor!,
        descriptionTypography: tokens.descriptionTypography!,
        descriptionColor: tokens.descriptionColor!,
        footerBorder: tokens.footerBorder!,
        transition: tokens.transition!,
        closeIcon: icons.closeIcon!,
        tokens,
        focusRingColor,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
