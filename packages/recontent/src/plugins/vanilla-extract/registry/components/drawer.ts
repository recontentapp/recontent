import type { ComponentSourceFiles, TokenImport } from "../types.js";
import { focusRingBlock, groupVariantTokens } from "./shared.js";

const SIZE_KEYS = ["sm", "md", "lg", "full"] as const;

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

export function generateDrawerSources(bindings: {
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
    footerBorder,
    transition,
    closeIcon,
    tokens,
    focusRingColor,
  } = bindings;
  const sizes = groupVariantTokens(tokens, "sizes", ["size"]);

  return {
    styles: `import { keyframes, style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

const fadeIn = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });

export const drawerBackdrop = style({
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

export const drawerPopup = style({
  position: "fixed",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  zIndex: 60,
  gap: ${gap.reference},
  backgroundColor: ${backgroundColor.reference},
  border: ${border.reference},
  boxShadow: ${shadow.reference},
  paddingLeft: ${horizontalSpacing.reference},
  paddingRight: ${horizontalSpacing.reference},
  paddingTop: ${verticalSpacing.reference},
  paddingBottom: ${verticalSpacing.reference},
  transitionProperty: "translate, opacity",
  transitionDuration: ${transition.reference}.transitionDuration,
  transitionTimingFunction: ${transition.reference}.transitionTimingFunction,
  selectors: {
    "&[data-starting-style], &[data-ending-style]": {
      opacity: 0,
    },
  },
});

export const drawerPlacement = styleVariants({
  left: {
    top: 0,
    left: 0,
    bottom: 0,
    height: "100%",
    borderRight: ${border.reference},
    borderTopRightRadius: ${borderRadius.reference},
    borderBottomRightRadius: ${borderRadius.reference},
    selectors: {
      "&[data-starting-style], &[data-ending-style]": {
        translate: "-100% 0",
      },
    },
  },
  right: {
    top: 0,
    right: 0,
    bottom: 0,
    height: "100%",
    borderLeft: ${border.reference},
    borderTopLeftRadius: ${borderRadius.reference},
    borderBottomLeftRadius: ${borderRadius.reference},
    selectors: {
      "&[data-starting-style], &[data-ending-style]": {
        translate: "100% 0",
      },
    },
  },
  top: {
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    borderBottom: ${border.reference},
    borderBottomLeftRadius: ${borderRadius.reference},
    borderBottomRightRadius: ${borderRadius.reference},
    selectors: {
      "&[data-starting-style], &[data-ending-style]": {
        translate: "0 -100%",
      },
    },
  },
  bottom: {
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    borderTop: ${border.reference},
    borderTopLeftRadius: ${borderRadius.reference},
    borderTopRightRadius: ${borderRadius.reference},
    selectors: {
      "&[data-starting-style], &[data-ending-style]": {
        translate: "0 100%",
      },
    },
  },
});

export const drawerSizeHorizontal = styleVariants({
${SIZE_KEYS.map((name) => `  ${JSON.stringify(name)}: { width: ${sizes[name]?.size?.reference ?? "auto"} },`).join("\n")}
});

export const drawerSizeVertical = styleVariants({
${SIZE_KEYS.map((name) => `  ${JSON.stringify(name)}: { height: ${sizes[name]?.size?.reference ?? "auto"} },`).join("\n")}
});

export const drawerHeader = style({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: ${gap.reference},
});

export const drawerTitle = style({
  margin: 0,
  color: ${titleColor.reference},
  ${typographyProps(titleTypography.reference)},
});

export const drawerClose = style({
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

export const drawerCloseIcon = style({
  display: "inline-flex",
  width: "1.25em",
  height: "1.25em",
});

export const drawerBody = style({
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
});

export const drawerFooter = style({
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

const CloseIcon = icons[${JSON.stringify(closeIcon)}];

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
`,
  };
}

import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import type { IconName } from "../internal/icon-map-icons.js";
import { vanillaExtractComponentOutput } from "./shared.js";

export type DrawerComponentOptions = {
  backdropColor: TokenBinding<"color">;
  backgroundColor: TokenBinding<"color">;
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
  shadow: TokenBinding<"shadow">;
  /** Fixed keys, matching the `size` prop's literal union. */
  sizes: Record<"sm" | "md" | "lg" | "full", { size: TokenBinding<"dimension"> }>;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
  titleTypography: TokenBinding<"typography">;
  titleColor: TokenBinding<"color">;
  footerBorder: TokenBinding<"border">;
  transition: TokenBinding<"transition">;
  closeIcon: IconName;
};

export const drawerComponent = defineRegistryComponent<DrawerComponentOptions>()({
  id: "drawer",
  name: "Drawer",
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
      description: "Background color of the drawer.",
    },
    border: { kind: "token", type: "border", description: "Border applied around the drawer." },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the drawer.",
    },
    shadow: { kind: "token", type: "shadow", description: "Shadow applied to the drawer." },
    sizes: {
      kind: "variants",
      description: "Drawer's fixed sizes (sm | md | lg | full), drives the size prop.",
      fields: {
        size: { kind: "token", type: "dimension" },
      },
    },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the drawer.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the drawer.",
    },
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between the header, body and footer.",
    },
    titleTypography: { kind: "token", type: "typography", description: "Typography of the title." },
    titleColor: { kind: "token", type: "color", description: "Text color of the title." },
    footerBorder: { kind: "token", type: "border", description: "Border above the footer." },
    transition: {
      kind: "token",
      type: "transition",
      description: "Transition used to slide the drawer in/out.",
    },
    closeIcon: { kind: "icon", description: "Icon used by the close button." },
  },
  output: vanillaExtractComponentOutput(
    "drawer",
    "Drawer",
    (_scales, _breakpoints, tokens, focusRingColor, icons) =>
      generateDrawerSources({
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
        footerBorder: tokens.footerBorder!,
        transition: tokens.transition!,
        closeIcon: icons.closeIcon!,
        tokens,
        focusRingColor,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
