import type { ComponentSourceFiles, TokenImport } from "../../types.js";

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

export function generateTooltipSources(bindings: {
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
  transitionDuration: TokenImport;
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
    transitionDuration,
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
  ${typographyProps(typography.reference)},
  transitionProperty: "opacity, transform",
  transitionDuration: ${transitionDuration.reference},
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
