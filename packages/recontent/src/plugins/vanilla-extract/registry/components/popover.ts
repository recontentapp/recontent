import type { ComponentSourceFiles, TokenImport } from "../types.js";

export function generatePopoverSources(bindings: {
  backgroundColor: TokenImport;
  color: TokenImport;
  border: TokenImport;
  borderRadius: TokenImport;
  shadow: TokenImport;
  horizontalSpacing: TokenImport;
  verticalSpacing: TokenImport;
  offset: TokenImport;
  maxWidth: TokenImport;
  backdropColor: TokenImport;
  arrowSize: TokenImport;
  transition: TokenImport;
  /** Build-time config, baked directly into the generated component. */
  showArrow: boolean;
}): ComponentSourceFiles {
  const {
    backgroundColor,
    color,
    border,
    borderRadius,
    shadow,
    horizontalSpacing,
    verticalSpacing,
    offset,
    maxWidth,
    backdropColor,
    arrowSize,
    transition,
    showArrow,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const popoverBackdrop = style({
  position: "fixed",
  inset: 0,
  backgroundColor: ${backdropColor.reference},
  zIndex: 55,
  selectors: {
    "&[data-starting-style], &[data-ending-style]": {
      opacity: 0,
    },
  },
  transitionProperty: "opacity",
  transitionDuration: ${transition.reference}.transitionDuration,
  transitionTimingFunction: ${transition.reference}.transitionTimingFunction,
});

export const popoverPositioner = style({
  outline: "none",
  zIndex: 55,
  selectors: {
    '&[data-side="top"]': { marginBottom: ${offset.reference} },
    '&[data-side="bottom"]': { marginTop: ${offset.reference} },
    '&[data-side="left"]': { marginRight: ${offset.reference} },
    '&[data-side="right"]': { marginLeft: ${offset.reference} },
  },
});

export const popoverPopup = style({
  boxSizing: "border-box",
  maxWidth: ${maxWidth.reference},
  color: ${color.reference},
  backgroundColor: ${backgroundColor.reference},
  border: ${border.reference},
  borderRadius: ${borderRadius.reference},
  boxShadow: ${shadow.reference},
  paddingLeft: ${horizontalSpacing.reference},
  paddingRight: ${horizontalSpacing.reference},
  paddingTop: ${verticalSpacing.reference},
  paddingBottom: ${verticalSpacing.reference},
  outline: "none",
  transitionProperty: "opacity, transform",
  transitionDuration: ${transition.reference}.transitionDuration,
  transitionTimingFunction: ${transition.reference}.transitionTimingFunction,
  selectors: {
    "&[data-starting-style], &[data-ending-style]": {
      opacity: 0,
    },
  },
});

export const popoverArrow = style({
  width: ${arrowSize.reference},
  height: ${arrowSize.reference},
  selectors: {
    '&[data-side="top"]': { bottom: \`calc(${arrowSize.reference} / -2)\` },
    '&[data-side="bottom"]': { top: \`calc(${arrowSize.reference} / -2)\` },
    '&[data-side="left"]': { right: \`calc(${arrowSize.reference} / -2)\` },
    '&[data-side="right"]': { left: \`calc(${arrowSize.reference} / -2)\` },
  },
});

export const popoverArrowShape = style({
  width: "100%",
  height: "100%",
  backgroundColor: ${backgroundColor.reference},
  transform: "rotate(45deg)",
  borderRadius: "2px",
});
`,
    component: `import type { ReactElement, ReactNode } from "react";
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
            {${JSON.stringify(showArrow)} && (
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
`,
  };
}

import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { vanillaExtractComponentOutput } from "./shared.js";

export type PopoverComponentOptions = {
  backgroundColor: TokenBinding<"color">;
  color: TokenBinding<"color">;
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
  shadow: TokenBinding<"shadow">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  offset: TokenBinding<"dimension">;
  maxWidth: TokenBinding<"dimension">;
  /** Only used when `modal` is true. */
  backdropColor: TokenBinding<"color">;
  arrowSize: TokenBinding<"dimension">;
  transition: TokenBinding<"transition">;
};

/**
 * `arrow` is a plain build-time "Option" switch — not a token binding, so it
 * isn't a `ComponentContract` kind either (only "token" | "scale" |
 * "variants" are). Like Tooltip's arrow, it's a build-time choice baked
 * directly into the generated component.
 */
const SHOW_ARROW = true;

export const popoverComponent = defineRegistryComponent<PopoverComponentOptions>()({
  id: "popover",
  name: "Popover",
  internalDependencies: ["render-element"],
  schema: {
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the popover.",
    },
    color: { kind: "token", type: "color", description: "Text color of the popover." },
    border: { kind: "token", type: "border", description: "Border applied around the popover." },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the popover.",
    },
    shadow: { kind: "token", type: "shadow", description: "Shadow applied to the popover." },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the popover.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the popover.",
    },
    offset: {
      kind: "token",
      type: "dimension",
      description: "Gap between the trigger and the popover.",
    },
    maxWidth: { kind: "token", type: "dimension", description: "Maximum width of the popover." },
    backdropColor: {
      kind: "token",
      type: "color",
      description: "Background color of the backdrop, shown only when modal.",
    },
    arrowSize: { kind: "token", type: "dimension", description: "Size of the arrow." },
    transition: {
      kind: "token",
      type: "transition",
      description: "Transition used to open/close the popover.",
    },
  },
  output: vanillaExtractComponentOutput(
    "popover",
    "Popover",
    (_scales, _breakpoints, tokens) =>
      generatePopoverSources({
        backgroundColor: tokens.backgroundColor!,
        color: tokens.color!,
        border: tokens.border!,
        borderRadius: tokens.borderRadius!,
        shadow: tokens.shadow!,
        horizontalSpacing: tokens.horizontalSpacing!,
        verticalSpacing: tokens.verticalSpacing!,
        offset: tokens.offset!,
        maxWidth: tokens.maxWidth!,
        backdropColor: tokens.backdropColor!,
        arrowSize: tokens.arrowSize!,
        transition: tokens.transition!,
        showArrow: SHOW_ARROW,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
