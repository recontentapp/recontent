import type { ComponentSourceFiles, TokenImport } from "../types.js";
import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { typographyProps, vanillaExtractComponentOutput } from "./shared.js";
function generateTooltipSources(bindings: {
  backgroundColor: TokenImport;
  color: TokenImport;
  typography: TokenImport;
  borderRadius: TokenImport;
  border: TokenImport;
  shadow: TokenImport;
  horizontalSpacing: TokenImport;
  verticalSpacing: TokenImport;
  offset: TokenImport;
  maxWidth: TokenImport;
  arrowSize: TokenImport;
  transition: TokenImport;
  /** Build-time config, baked directly into the generated component. */
  showArrow: boolean;
}): ComponentSourceFiles {
  const {
    backgroundColor,
    color,
    typography,
    borderRadius,
    border,
    shadow,
    horizontalSpacing,
    verticalSpacing,
    offset,
    maxWidth,
    arrowSize,
    transition,
    showArrow,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const tooltipPositioner = style({
  outline: "none",
  zIndex: 70,
  selectors: {
    '&[data-side="top"]': { marginBottom: ${offset.reference} },
    '&[data-side="bottom"]': { marginTop: ${offset.reference} },
    '&[data-side="left"]': { marginRight: ${offset.reference} },
    '&[data-side="right"]': { marginLeft: ${offset.reference} },
  },
});

export const tooltipPopup = style({
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
  ${typographyProps(typography.reference, "      ")},
  transitionProperty: "opacity, transform",
  transitionDuration: ${transition.reference}.transitionDuration,
  transitionTimingFunction: ${transition.reference}.transitionTimingFunction,
  selectors: {
    "&[data-starting-style], &[data-ending-style]": {
      opacity: 0,
    },
  },
});

export const tooltipArrow = style({
  width: ${arrowSize.reference},
  height: ${arrowSize.reference},
  selectors: {
    '&[data-side="top"]': { bottom: \`calc(${arrowSize.reference} / -2)\` },
    '&[data-side="bottom"]': { top: \`calc(${arrowSize.reference} / -2)\` },
    '&[data-side="left"]': { right: \`calc(${arrowSize.reference} / -2)\` },
    '&[data-side="right"]': { left: \`calc(${arrowSize.reference} / -2)\` },
  },
});

export const tooltipArrowShape = style({
  width: "100%",
  height: "100%",
  backgroundColor: ${backgroundColor.reference},
  transform: "rotate(45deg)",
  borderRadius: "2px",
});
`,
    component: `import type { ReactElement, ReactNode } from "react";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { tooltipArrow, tooltipArrowShape, tooltipPopup, tooltipPositioner } from "./Tooltip.gen.css";
import type { CommonComponentProps } from "../../renderElement.gen";

export interface TooltipProps extends CommonComponentProps {
  content: ReactNode;
  children: ReactElement;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  /** Hover delay in ms before showing. */
  delay?: number;
  closeDelay?: number;
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  open,
  defaultOpen,
  onOpenChange,
  side = "top",
  align = "center",
  delay,
  closeDelay,
  disabled = false,
  className,
  ...props
}: TooltipProps) {
  return (
    <BaseTooltip.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} disabled={disabled}>
      <BaseTooltip.Trigger render={children} delay={delay} closeDelay={closeDelay} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner className={tooltipPositioner} side={side} align={align}>
          <BaseTooltip.Popup
            {...props}
            className={[tooltipPopup, className].filter(Boolean).join(" ")}
            data-slot="tooltip"
          >
            {${JSON.stringify(showArrow)} && (
              <BaseTooltip.Arrow className={tooltipArrow}>
                <div className={tooltipArrowShape} />
              </BaseTooltip.Arrow>
            )}
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
`,
  };
}

export type TooltipComponentOptions = {
  backgroundColor: TokenBinding<"color">;
  color: TokenBinding<"color">;
  typography: TokenBinding<"typography">;
  borderRadius: TokenBinding<"dimension">;
  border: TokenBinding<"border">;
  shadow: TokenBinding<"shadow">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  offset: TokenBinding<"dimension">;
  maxWidth: TokenBinding<"dimension">;
  arrowSize: TokenBinding<"dimension">;
  transition: TokenBinding<"transition">;
};

/**
 * `arrow` is a plain build-time "Option" switch — not a token binding, so it
 * isn't a `ComponentContract` kind either (only "token" | "scale" |
 * "variants" are). Like Collapsible's indicator icon, it's a build-time
 * choice baked directly into the generated component.
 */
const SHOW_ARROW = true;

export const tooltipComponent = defineRegistryComponent<TooltipComponentOptions>()({
  id: "tooltip",
  name: "Tooltip",
  internalDependencies: ["render-element"],
  schema: {
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the tooltip.",
    },
    color: { kind: "token", type: "color", description: "Text color of the tooltip." },
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to the tooltip.",
    },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the tooltip.",
    },
    border: { kind: "token", type: "border", description: "Border applied around the tooltip." },
    shadow: { kind: "token", type: "shadow", description: "Shadow applied to the tooltip." },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the tooltip.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the tooltip.",
    },
    offset: {
      kind: "token",
      type: "dimension",
      description: "Gap between the trigger and the tooltip.",
    },
    maxWidth: { kind: "token", type: "dimension", description: "Maximum width of the tooltip." },
    arrowSize: { kind: "token", type: "dimension", description: "Size of the arrow." },
    transition: {
      kind: "token",
      type: "transition",
      description: "Transition used to open/close the tooltip.",
    },
  },
  output: vanillaExtractComponentOutput(
    "tooltip",
    "Tooltip",
    (_scales, _breakpoints, tokens) =>
      generateTooltipSources({
        backgroundColor: tokens.backgroundColor!,
        color: tokens.color!,
        typography: tokens.typography!,
        borderRadius: tokens.borderRadius!,
        border: tokens.border!,
        shadow: tokens.shadow!,
        horizontalSpacing: tokens.horizontalSpacing!,
        verticalSpacing: tokens.verticalSpacing!,
        offset: tokens.offset!,
        maxWidth: tokens.maxWidth!,
        arrowSize: tokens.arrowSize!,
        transition: tokens.transition!,
        showArrow: SHOW_ARROW,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
